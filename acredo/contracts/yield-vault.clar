;; ============================================================
;; ACREDO — yield-vault.clar
;; Users deposit USDCx to earn yield.
;; Borrow limit = projected-yield × 50% haircut.
;; Health factor = (projected-yield × 0.5) / debt
;; Liquidation triggered when health factor < 1.0
;; ============================================================

;; ─── CONSTANTS ───────────────────────────────────────────────

(define-constant CONTRACT-OWNER tx-sender)

(define-constant ERR-NOT-OWNER          (err u600))
(define-constant ERR-NOT-AUTHORISED     (err u601))
(define-constant ERR-ZERO-AMOUNT        (err u602))
(define-constant ERR-NO-DEPOSIT         (err u603))
(define-constant ERR-EXCEEDS-LIMIT      (err u604))
(define-constant ERR-HEALTH-FACTOR      (err u605))
(define-constant ERR-NOT-LIQUIDATABLE   (err u606))
(define-constant ERR-WITHDRAW-BLOCKED   (err u607))
(define-constant ERR-CALL-FAILED        (err u608))
(define-constant ERR-WITHDRAW-TOO-LARGE (err u609))

;; APY stored as basis points (1200 = 12%)
;; Fixed for MVP — in production this comes from external protocol
(define-constant APY-BPS u1200)

;; Haircut: 50% = 5000 bps
(define-constant HAIRCUT-BPS u5000)

;; Health factor liquidation threshold: 1.0 (stored as scaled integer)
;; We use 10000 as the scaling factor: HF = 10000 means 1.0
(define-constant HF-LIQUIDATION-THRESHOLD u10000)

;; Blocks per year (approx: 144 blocks/day × 365)
(define-constant BLOCKS-PER-YEAR u52560)

;; ─── DATA VARS ───────────────────────────────────────────────

(define-data-var vault-total-deposits uint u0)   ;; total USDCx deposited (micro)
(define-data-var vault-total-debt uint u0)        ;; total USDCx borrowed against yield

;; ─── DATA MAPS ───────────────────────────────────────────────

;; User vault position
(define-map positions
  principal
  {
    deposit:        uint,   ;; micro-USDCx deposited
    debt:           uint,   ;; micro-USDCx borrowed against yield
    deposit-height: uint,   ;; block height at deposit (for yield calc)
    duration-days:  uint    ;; chosen duration for yield projection
  }
)

;; ─── PRIVATE HELPERS ─────────────────────────────────────────

(define-private (is-owner)
  (is-eq tx-sender CONTRACT-OWNER)
)

;; Projected yield = deposit × APY-BPS × duration-days / (365 × 10000)
(define-private (calc-projected-yield (deposit uint) (duration-days uint))
  (/ (* (* deposit APY-BPS) duration-days) (* u365 u10000))
)

;; Borrow limit = projected-yield × HAIRCUT-BPS / 10000
(define-private (calc-borrow-limit (projected-yield uint))
  (/ (* projected-yield HAIRCUT-BPS) u10000)
)

;; Health factor (scaled × 10000):
;; HF = (projected-yield × HAIRCUT / 10000) × 10000 / debt
;; = (borrow-limit × 10000) / debt
;; Returns 0 if debt = 0 (treat as infinite)
(define-private (calc-hf-scaled (projected-yield uint) (debt uint))
  (if (is-eq debt u0)
    u99999  ;; represents "safe / infinite"
    (let ((borrow-limit (calc-borrow-limit projected-yield)))
      (/ (* borrow-limit u10000) debt)
    )
  )
)

;; ─── PUBLIC FUNCTIONS ────────────────────────────────────────

;; Deposit USDCx into vault
(define-public (deposit (amount uint) (duration-days uint))
  (begin
    (asserts! (> amount u0) ERR-ZERO-AMOUNT)
    (asserts! (> duration-days u0) ERR-ZERO-AMOUNT)

    ;; In production: (try! (contract-call? .usdcx transfer amount tx-sender (as-contract tx-sender) none))

    (let ((existing (default-to { deposit: u0, debt: u0, deposit-height: block-height, duration-days: duration-days } (map-get? positions tx-sender))))
      (map-set positions tx-sender {
        deposit:        (+ (get deposit existing) amount),
        debt:           (get debt existing),
        deposit-height: block-height,
        duration-days:  duration-days
      })
      (var-set vault-total-deposits (+ (var-get vault-total-deposits) amount))
      (ok amount)
    )
  )
)

;; Withdraw USDCx — only allowed if health factor stays safe after withdrawal
(define-public (withdraw (amount uint))
  (begin
    (asserts! (> amount u0) ERR-ZERO-AMOUNT)
    (let (
      (pos (unwrap! (map-get? positions tx-sender) ERR-NO-DEPOSIT))
      (deposit (get deposit pos))
      (debt (get debt pos))
      (dur (get duration-days pos))
    )
      (asserts! (>= deposit amount) ERR-WITHDRAW-TOO-LARGE)

      ;; Check that remaining deposit still supports the existing debt
      (let (
        (new-deposit (- deposit amount))
        (new-yield (calc-projected-yield new-deposit dur))
        (new-hf (calc-hf-scaled new-yield debt))
      )
        (asserts! (or (is-eq debt u0) (>= new-hf HF-LIQUIDATION-THRESHOLD)) ERR-WITHDRAW-BLOCKED)

        ;; In production: transfer amount USDCx back to user
        (map-set positions tx-sender (merge pos { deposit: new-deposit }))
        (var-set vault-total-deposits (- (var-get vault-total-deposits) amount))
        (ok amount)
      )
    )
  )
)

;; Borrow against projected yield
;; Borrows from liquidity-pool.clar yield pool
(define-public (borrow-against-yield (amount uint))
  (begin
    (asserts! (> amount u0) ERR-ZERO-AMOUNT)
    (let (
      (pos (unwrap! (map-get? positions tx-sender) ERR-NO-DEPOSIT))
      (deposit (get deposit pos))
      (existing-debt (get debt pos))
      (dur (get duration-days pos))
    )
      (asserts! (> deposit u0) ERR-NO-DEPOSIT)

      (let (
        (proj-yield (calc-projected-yield deposit dur))
        (borrow-limit (calc-borrow-limit proj-yield))
        (new-debt (+ existing-debt amount))
      )
        (asserts! (<= new-debt borrow-limit) ERR-EXCEEDS-LIMIT)

        ;; Check health factor after borrow
        (let ((new-hf (calc-hf-scaled proj-yield new-debt)))
          (asserts! (>= new-hf HF-LIQUIDATION-THRESHOLD) ERR-HEALTH-FACTOR)

          ;; Disburse from yield pool
          (unwrap! (contract-call? .liquidity-pool disburse-usdcx tx-sender amount) ERR-CALL-FAILED)

          ;; Update position
          (map-set positions tx-sender (merge pos { debt: new-debt }))
          (var-set vault-total-debt (+ (var-get vault-total-debt) amount))

          (ok amount)
        )
      )
    )
  )
)

;; Repay yield borrow
(define-public (repay-yield-borrow (amount uint))
  (begin
    (asserts! (> amount u0) ERR-ZERO-AMOUNT)
    (let (
      (pos (unwrap! (map-get? positions tx-sender) ERR-NO-DEPOSIT))
      (existing-debt (get debt pos))
    )
      (asserts! (>= existing-debt amount) ERR-ZERO-AMOUNT)

      ;; In production: transfer amount USDCx from user to contract
      (unwrap! (contract-call? .liquidity-pool receive-repayment-usdcx amount) ERR-CALL-FAILED)

      (map-set positions tx-sender (merge pos { debt: (- existing-debt amount) }))
      (var-set vault-total-debt (- (var-get vault-total-debt) amount))

      (ok amount)
    )
  )
)

;; Liquidate a position whose health factor has dropped below 1.0
;; Callable by anyone — protocol incentive to call this
(define-public (liquidate (user principal))
  (let (
    (pos (unwrap! (map-get? positions user) ERR-NO-DEPOSIT))
    (deposit (get deposit pos))
    (debt (get debt pos))
    (dur (get duration-days pos))
  )
    (asserts! (> debt u0) ERR-NOT-LIQUIDATABLE)
    (let (
      (proj-yield (calc-projected-yield deposit dur))
      (hf (calc-hf-scaled proj-yield debt))
    )
      (asserts! (< hf HF-LIQUIDATION-THRESHOLD) ERR-NOT-LIQUIDATABLE)

      ;; Seize deposit to cover debt
      ;; In production: transfer deposit to liquidator/treasury minus fee
      (map-set positions user (merge pos { debt: u0, deposit: u0 }))
      (var-set vault-total-deposits (- (var-get vault-total-deposits) deposit))
      (var-set vault-total-debt (- (var-get vault-total-debt) debt))

      (ok user)
    )
  )
)

;; ─── READ-ONLY ────────────────────────────────────────────────

(define-read-only (get-position (user principal))
  (ok (map-get? positions user))
)

(define-read-only (get-projected-yield (user principal))
  (let ((pos (unwrap! (map-get? positions user) ERR-NO-DEPOSIT)))
    (ok (calc-projected-yield (get deposit pos) (get duration-days pos)))
  )
)

(define-read-only (get-borrow-limit (user principal))
  (let ((pos (unwrap! (map-get? positions user) ERR-NO-DEPOSIT)))
    (let ((proj-yield (calc-projected-yield (get deposit pos) (get duration-days pos))))
      (ok (calc-borrow-limit proj-yield))
    )
  )
)

;; Returns health factor scaled by 10000 (10000 = 1.0)
(define-read-only (get-health-factor (user principal))
  (let ((pos (unwrap! (map-get? positions user) ERR-NO-DEPOSIT)))
    (let (
      (proj-yield (calc-projected-yield (get deposit pos) (get duration-days pos)))
      (debt (get debt pos))
    )
      (ok (calc-hf-scaled proj-yield debt))
    )
  )
)

(define-read-only (get-vault-stats)
  (ok {
    total-deposits: (var-get vault-total-deposits),
    total-debt:     (var-get vault-total-debt),
    apy-bps:        APY-BPS
  })
)

;; Preview borrow limit for a given deposit + duration (no account needed)
(define-read-only (preview-borrow-limit (deposit-amount uint) (duration-days uint))
  (let (
    (proj-yield (calc-projected-yield deposit-amount duration-days))
    (limit (calc-borrow-limit proj-yield))
  )
    (ok {
      projected-yield: proj-yield,
      borrow-limit:    limit
    })
  )
)
