;; ACREDO - yield-vault.clar

(define-constant CONTRACT-OWNER tx-sender)
(define-constant ERR-ZERO-AMOUNT        (err u602))
(define-constant ERR-NO-DEPOSIT         (err u603))
(define-constant ERR-EXCEEDS-LIMIT      (err u604))
(define-constant ERR-HEALTH-FACTOR      (err u605))
(define-constant ERR-NOT-LIQUIDATABLE   (err u606))
(define-constant ERR-WITHDRAW-BLOCKED   (err u607))
(define-constant ERR-CALL-FAILED        (err u608))
(define-constant ERR-WITHDRAW-TOO-LARGE (err u609))
(define-constant APY-BPS u1200)
(define-constant HAIRCUT-BPS u5000)
(define-constant HF-LIQUIDATION-THRESHOLD u10000)

(define-data-var vault-total-deposits uint u0)
(define-data-var vault-total-debt uint u0)

(define-map positions principal
  { dep: uint, debt: uint, dep-height: uint, dur-days: uint }
)

(define-private (calc-yield (d uint) (days uint))
  (/ (* (* d APY-BPS) days) (* u365 u10000))
)

(define-private (calc-limit (y uint))
  (/ (* y HAIRCUT-BPS) u10000)
)

(define-private (calc-hf (y uint) (debt uint))
  (if (is-eq debt u0)
    u99999
    (/ (* (calc-limit y) u10000) debt)
  )
)

(define-public (deposit (amount uint) (dur-days uint))
  (begin
    (asserts! (> amount u0) ERR-ZERO-AMOUNT)
    (asserts! (> dur-days u0) ERR-ZERO-AMOUNT)
    (let ((existing (default-to { dep: u0, debt: u0, dep-height: block-height, dur-days: dur-days } (map-get? positions tx-sender))))
      (map-set positions tx-sender {
        dep: (+ (get dep existing) amount),
        debt: (get debt existing),
        dep-height: block-height,
        dur-days: dur-days
      })
      (var-set vault-total-deposits (+ (var-get vault-total-deposits) amount))
      (ok amount)
    )
  )
)

(define-public (withdraw (amount uint))
  (begin
    (asserts! (> amount u0) ERR-ZERO-AMOUNT)
    (let (
      (pos (unwrap! (map-get? positions tx-sender) ERR-NO-DEPOSIT))
      (d (get dep pos))
      (debt (get debt pos))
      (days (get dur-days pos))
    )
      (asserts! (>= d amount) ERR-WITHDRAW-TOO-LARGE)
      (let (
        (new-d (- d amount))
        (new-y (calc-yield new-d days))
        (new-hf (calc-hf new-y debt))
      )
        (asserts! (or (is-eq debt u0) (>= new-hf HF-LIQUIDATION-THRESHOLD)) ERR-WITHDRAW-BLOCKED)
        (map-set positions tx-sender (merge pos { dep: new-d }))
        (var-set vault-total-deposits (- (var-get vault-total-deposits) amount))
        (ok amount)
      )
    )
  )
)

(define-public (borrow-against-yield (amount uint))
  (begin
    (asserts! (> amount u0) ERR-ZERO-AMOUNT)
    (let (
      (pos (unwrap! (map-get? positions tx-sender) ERR-NO-DEPOSIT))
      (d (get dep pos))
      (existing-debt (get debt pos))
      (days (get dur-days pos))
    )
      (asserts! (> d u0) ERR-NO-DEPOSIT)
      (let (
        (y (calc-yield d days))
        (lim (calc-limit y))
        (new-debt (+ existing-debt amount))
      )
        (asserts! (<= new-debt lim) ERR-EXCEEDS-LIMIT)
        (let ((new-hf (calc-hf y new-debt)))
          (asserts! (>= new-hf HF-LIQUIDATION-THRESHOLD) ERR-HEALTH-FACTOR)
          (unwrap! (contract-call? .liquidity-pool disburse-usdcx tx-sender amount) ERR-CALL-FAILED)
          (map-set positions tx-sender (merge pos { debt: new-debt }))
          (var-set vault-total-debt (+ (var-get vault-total-debt) amount))
          (ok amount)
        )
      )
    )
  )
)

(define-public (repay-yield-borrow (amount uint))
  (begin
    (asserts! (> amount u0) ERR-ZERO-AMOUNT)
    (let (
      (pos (unwrap! (map-get? positions tx-sender) ERR-NO-DEPOSIT))
      (existing-debt (get debt pos))
    )
      (asserts! (>= existing-debt amount) ERR-ZERO-AMOUNT)
      (unwrap! (contract-call? .liquidity-pool receive-repayment-usdcx amount) ERR-CALL-FAILED)
      (map-set positions tx-sender (merge pos { debt: (- existing-debt amount) }))
      (var-set vault-total-debt (- (var-get vault-total-debt) amount))
      (ok amount)
    )
  )
)

(define-public (liquidate (user principal))
  (let (
    (pos (unwrap! (map-get? positions user) ERR-NO-DEPOSIT))
    (d (get dep pos))
    (debt (get debt pos))
    (days (get dur-days pos))
  )
    (asserts! (> debt u0) ERR-NOT-LIQUIDATABLE)
    (let (
      (y (calc-yield d days))
      (hf (calc-hf y debt))
    )
      (asserts! (< hf HF-LIQUIDATION-THRESHOLD) ERR-NOT-LIQUIDATABLE)
      (map-set positions user (merge pos { debt: u0, dep: u0 }))
      (var-set vault-total-deposits (- (var-get vault-total-deposits) d))
      (var-set vault-total-debt (- (var-get vault-total-debt) debt))
      (ok user)
    )
  )
)

(define-read-only (get-position (user principal))
  (ok (map-get? positions user))
)

(define-read-only (get-health-factor (user principal))
  (let ((pos (unwrap! (map-get? positions user) ERR-NO-DEPOSIT)))
    (ok (calc-hf (calc-yield (get dep pos) (get dur-days pos)) (get debt pos)))
  )
)

(define-read-only (get-borrow-limit (user principal))
  (let ((pos (unwrap! (map-get? positions user) ERR-NO-DEPOSIT)))
    (ok (calc-limit (calc-yield (get dep pos) (get dur-days pos))))
  )
)

(define-read-only (get-vault-stats)
  (ok { total-deposits: (var-get vault-total-deposits), total-debt: (var-get vault-total-debt), apy-bps: APY-BPS })
)

(define-read-only (preview-borrow-limit (dep-amount uint) (dur-days uint))
  (let ((y (calc-yield dep-amount dur-days)))
    (ok { projected-yield: y, borrow-limit: (calc-limit y) })
  )
)
