;; ============================================================
;; ACREDO — liquidity-pool.clar
;; Manages LP capital for both the lending pool (sBTC) and
;; the yield borrow pool (USDCx). Borrowers draw from here.
;; ============================================================

;; ─── CONSTANTS ───────────────────────────────────────────────

(define-constant CONTRACT-OWNER tx-sender)

(define-constant ERR-NOT-OWNER          (err u200))
(define-constant ERR-NOT-AUTHORISED     (err u201))
(define-constant ERR-INSUFFICIENT-FUNDS (err u202))
(define-constant ERR-ZERO-AMOUNT        (err u203))
(define-constant ERR-NO-POSITION        (err u204))
(define-constant ERR-WITHDRAW-TOO-LARGE (err u205))

;; 1% origination fee (basis points out of 10000)
(define-constant ORIGINATION-FEE-BPS u100)

;; ─── FUNGIBLE TOKEN TRAITS ───────────────────────────────────
;; We use STX as a stand-in for sBTC and USDCx in the MVP.
;; In production these would be SIP-010 token calls.

;; ─── DATA VARS ───────────────────────────────────────────────

;; Total sBTC in lending pool (micro-sBTC)
(define-data-var lending-pool-total uint u0)

;; Total USDCx in yield pool (micro-USDCx, 6 decimals)
(define-data-var yield-pool-total uint u0)

;; Total sBTC currently lent out
(define-data-var lending-pool-deployed uint u0)

;; Total USDCx currently lent out
(define-data-var yield-pool-deployed uint u0)

;; Protocol treasury (fees collected)
(define-data-var treasury-sbtc uint u0)
(define-data-var treasury-usdcx uint u0)

;; ─── DATA MAPS ───────────────────────────────────────────────

;; LP positions in lending pool: principal → deposited micro-sBTC
(define-map lending-positions principal uint)

;; LP positions in yield pool: principal → deposited micro-USDCx
(define-map yield-positions principal uint)

;; Authorised callers (loan.clar, yield-vault.clar)
(define-map authorised-callers principal bool)

;; ─── PRIVATE HELPERS ─────────────────────────────────────────

(define-private (is-owner)
  (is-eq tx-sender CONTRACT-OWNER)
)

(define-private (is-authorised)
  (or
    (is-owner)
    (default-to false (map-get? authorised-callers tx-sender))
  )
)

(define-private (calc-fee (amount uint))
  (/ (* amount ORIGINATION-FEE-BPS) u10000)
)

;; ─── ADMIN ───────────────────────────────────────────────────

(define-public (add-authorised-caller (caller principal))
  (begin
    (asserts! (is-owner) ERR-NOT-OWNER)
    (map-set authorised-callers caller true)
    (ok true)
  )
)

(define-public (remove-authorised-caller (caller principal))
  (begin
    (asserts! (is-owner) ERR-NOT-OWNER)
    (map-delete authorised-callers caller)
    (ok true)
  )
)

;; ─── LENDING POOL (sBTC) ─────────────────────────────────────

;; LP deposits sBTC into the lending pool
(define-public (deposit-lending (amount uint))
  (begin
    (asserts! (> amount u0) ERR-ZERO-AMOUNT)
    ;; In production: (try! (contract-call? .sbtc transfer amount tx-sender (as-contract tx-sender) none))
    (let ((existing (default-to u0 (map-get? lending-positions tx-sender))))
      (map-set lending-positions tx-sender (+ existing amount))
      (var-set lending-pool-total (+ (var-get lending-pool-total) amount))
      (ok amount)
    )
  )
)

;; LP withdraws sBTC from lending pool
(define-public (withdraw-lending (amount uint))
  (begin
    (asserts! (> amount u0) ERR-ZERO-AMOUNT)
    (let (
      (existing (default-to u0 (map-get? lending-positions tx-sender)))
      (available (- (var-get lending-pool-total) (var-get lending-pool-deployed)))
    )
      (asserts! (>= existing amount) ERR-WITHDRAW-TOO-LARGE)
      (asserts! (>= available amount) ERR-INSUFFICIENT-FUNDS)
      (map-set lending-positions tx-sender (- existing amount))
      (var-set lending-pool-total (- (var-get lending-pool-total) amount))
      ;; In production: (try! (contract-call? .sbtc transfer amount (as-contract tx-sender) tx-sender none))
      (ok amount)
    )
  )
)

;; Called by loan.clar to disburse sBTC to a borrower
(define-public (disburse-sbtc (borrower principal) (amount uint))
  (begin
    (asserts! (is-authorised) ERR-NOT-AUTHORISED)
    (asserts! (> amount u0) ERR-ZERO-AMOUNT)
    (let (
      (available (- (var-get lending-pool-total) (var-get lending-pool-deployed)))
      (fee (calc-fee amount))
      (net (- amount fee))
    )
      (asserts! (>= available amount) ERR-INSUFFICIENT-FUNDS)
      (var-set lending-pool-deployed (+ (var-get lending-pool-deployed) net))
      (var-set treasury-sbtc (+ (var-get treasury-sbtc) fee))
      ;; In production: transfer net sBTC to borrower
      (ok net)
    )
  )
)

;; Called by loan.clar when borrower repays sBTC
(define-public (receive-repayment-sbtc (amount uint))
  (begin
    (asserts! (is-authorised) ERR-NOT-AUTHORISED)
    (asserts! (> amount u0) ERR-ZERO-AMOUNT)
    (var-set lending-pool-deployed
      (if (>= (var-get lending-pool-deployed) amount)
        (- (var-get lending-pool-deployed) amount)
        u0
      )
    )
    (var-set lending-pool-total (+ (var-get lending-pool-total) amount))
    (ok amount)
  )
)

;; ─── YIELD POOL (USDCx) ──────────────────────────────────────

;; LP deposits USDCx into the yield pool
(define-public (deposit-yield-pool (amount uint))
  (begin
    (asserts! (> amount u0) ERR-ZERO-AMOUNT)
    ;; In production: (try! (contract-call? .usdcx transfer amount tx-sender (as-contract tx-sender) none))
    (let ((existing (default-to u0 (map-get? yield-positions tx-sender))))
      (map-set yield-positions tx-sender (+ existing amount))
      (var-set yield-pool-total (+ (var-get yield-pool-total) amount))
      (ok amount)
    )
  )
)

;; LP withdraws USDCx from yield pool
(define-public (withdraw-yield-pool (amount uint))
  (begin
    (asserts! (> amount u0) ERR-ZERO-AMOUNT)
    (let (
      (existing (default-to u0 (map-get? yield-positions tx-sender)))
      (available (- (var-get yield-pool-total) (var-get yield-pool-deployed)))
    )
      (asserts! (>= existing amount) ERR-WITHDRAW-TOO-LARGE)
      (asserts! (>= available amount) ERR-INSUFFICIENT-FUNDS)
      (map-set yield-positions tx-sender (- existing amount))
      (var-set yield-pool-total (- (var-get yield-pool-total) amount))
      ;; In production: (try! (contract-call? .usdcx transfer amount (as-contract tx-sender) tx-sender none))
      (ok amount)
    )
  )
)

;; Called by yield-vault.clar to disburse USDCx to a borrower
(define-public (disburse-usdcx (borrower principal) (amount uint))
  (begin
    (asserts! (is-authorised) ERR-NOT-AUTHORISED)
    (asserts! (> amount u0) ERR-ZERO-AMOUNT)
    (let (
      (available (- (var-get yield-pool-total) (var-get yield-pool-deployed)))
      (fee (calc-fee amount))
      (net (- amount fee))
    )
      (asserts! (>= available amount) ERR-INSUFFICIENT-FUNDS)
      (var-set yield-pool-deployed (+ (var-get yield-pool-deployed) net))
      (var-set treasury-usdcx (+ (var-get treasury-usdcx) fee))
      ;; In production: transfer net USDCx to borrower
      (ok net)
    )
  )
)

;; Called by yield-vault.clar on repayment
(define-public (receive-repayment-usdcx (amount uint))
  (begin
    (asserts! (is-authorised) ERR-NOT-AUTHORISED)
    (asserts! (> amount u0) ERR-ZERO-AMOUNT)
    (var-set yield-pool-deployed
      (if (>= (var-get yield-pool-deployed) amount)
        (- (var-get yield-pool-deployed) amount)
        u0
      )
    )
    (var-set yield-pool-total (+ (var-get yield-pool-total) amount))
    (ok amount)
  )
)

;; ─── READ-ONLY ────────────────────────────────────────────────

(define-read-only (get-lending-pool-stats)
  (ok {
    total: (var-get lending-pool-total),
    deployed: (var-get lending-pool-deployed),
    available: (- (var-get lending-pool-total) (var-get lending-pool-deployed)),
    utilization: (if (is-eq (var-get lending-pool-total) u0)
                   u0
                   (/ (* (var-get lending-pool-deployed) u10000) (var-get lending-pool-total))
                 )
  })
)

(define-read-only (get-yield-pool-stats)
  (ok {
    total: (var-get yield-pool-total),
    deployed: (var-get yield-pool-deployed),
    available: (- (var-get yield-pool-total) (var-get yield-pool-deployed)),
    utilization: (if (is-eq (var-get yield-pool-total) u0)
                   u0
                   (/ (* (var-get yield-pool-deployed) u10000) (var-get yield-pool-total))
                 )
  })
)

(define-read-only (get-lp-position-lending (lp principal))
  (ok (default-to u0 (map-get? lending-positions lp)))
)

(define-read-only (get-lp-position-yield (lp principal))
  (ok (default-to u0 (map-get? yield-positions lp)))
)

(define-read-only (get-treasury)
  (ok { sbtc: (var-get treasury-sbtc), usdcx: (var-get treasury-usdcx) })
)
