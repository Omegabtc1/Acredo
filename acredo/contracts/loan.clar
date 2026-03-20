;; ============================================================
;; ACREDO - loan.clar
;; Handles the full loan lifecycle: fund -> repay -> default.
;; Calls reputation.clar on default.
;; Calls liquidity-pool.clar on repayment.
;; Works in conjunction with loan-factory.clar.
;; ============================================================

;; --- CONSTANTS -----------------------------------------------

(define-constant CONTRACT-OWNER tx-sender)

(define-constant ERR-NOT-OWNER         (err u400))
(define-constant ERR-NOT-BORROWER      (err u401))
(define-constant ERR-NOT-ACTIVE        (err u402))
(define-constant ERR-NOT-DEFAULTED     (err u403))
(define-constant ERR-ALREADY-REPAID    (err u404))
(define-constant ERR-NOT-DUE           (err u405))
(define-constant ERR-ZERO-AMOUNT       (err u406))
(define-constant ERR-LOAN-NOT-FOUND    (err u407))
(define-constant ERR-WRONG-AMOUNT      (err u408))
(define-constant ERR-CALL-FAILED       (err u409))

;; Blocks per day approximation on Stacks
(define-constant BLOCKS-PER-DAY u144)

;; --- DATA MAPS -----------------------------------------------

;; Full loan state indexed by loan-id
(define-map loan-state
  uint
  {
    borrower:      principal,
    lender:        (optional principal),
    amount:        uint,        ;; principal in micro-sBTC
    rate-bps:      uint,        ;; annual rate in basis points
    duration-days: uint,
    start-height:  uint,
    due-height:    uint,
    repaid-height: (optional uint),
    status:        (string-ascii 10),  ;; "active" | "repaid" | "defaulted"
    total-owed:    uint         ;; principal + interest
  }
)

;; --- PRIVATE HELPERS -----------------------------------------

(define-private (is-owner)
  (is-eq tx-sender CONTRACT-OWNER)
)

;; Interest = principal x rate-bps x duration-days / (365 x 10000)
;; Integer arithmetic - rounds down
(define-private (calc-interest (principal uint) (rate-bps uint) (duration-days uint))
  (/ (* (* principal rate-bps) duration-days) (* u365 u10000))
)

;; --- PUBLIC FUNCTIONS ----------------------------------------

;; Register an active loan (called by loan-factory after funding)
(define-public (register-loan
  (loan-id uint)
  (borrower principal)
  (lender principal)
  (amount uint)
  (rate-bps uint)
  (duration-days uint)
)
  (begin
    (asserts! (is-owner) ERR-NOT-OWNER)
    (let (
      (interest (calc-interest amount rate-bps duration-days))
      (due-height (+ block-height (* duration-days BLOCKS-PER-DAY)))
    )
      (map-set loan-state loan-id {
        borrower:      borrower,
        lender:        (some lender),
        amount:        amount,
        rate-bps:      rate-bps,
        duration-days: duration-days,
        start-height:  block-height,
        due-height:    due-height,
        repaid-height: none,
        status:        "active",
        total-owed:    (+ amount interest)
      })
      (ok loan-id)
    )
  )
)

;; Borrower repays the loan
;; payment must equal total-owed
(define-public (repay-loan (loan-id uint))
  (let (
    (loan (unwrap! (map-get? loan-state loan-id) ERR-LOAN-NOT-FOUND))
  )
    (asserts! (is-eq tx-sender (get borrower loan)) ERR-NOT-BORROWER)
    (asserts! (is-eq (get status loan) "active") ERR-NOT-ACTIVE)

    (let ((owed (get total-owed loan)))
      ;; In production: transfer owed sBTC from borrower to contract
      ;; (try! (contract-call- .sbtc transfer owed tx-sender (as-contract tx-sender) none))

      ;; Return funds to pool
      (unwrap! (contract-call? .liquidity-pool receive-repayment-sbtc owed) ERR-CALL-FAILED)

      ;; Update state
      (map-set loan-state loan-id (merge loan {
        status:        "repaid",
        repaid-height: (some block-height)
      }))

      (ok owed)
    )
  )
)

;; Trigger default - callable by anyone once due-height has passed
(define-public (trigger-default (loan-id uint))
  (let (
    (loan (unwrap! (map-get? loan-state loan-id) ERR-LOAN-NOT-FOUND))
  )
    (asserts! (is-eq (get status loan) "active") ERR-NOT-ACTIVE)
    (asserts! (>= block-height (get due-height loan)) ERR-NOT-DUE)

    ;; Mark defaulted
    (map-set loan-state loan-id (merge loan { status: "defaulted" }))

    ;; Penalise borrower reputation
    (unwrap! (contract-call? .reputation record-default (get borrower loan)) ERR-CALL-FAILED)

    (ok loan-id)
  )
)

;; --- READ-ONLY ------------------------------------------------

(define-read-only (get-loan-state (loan-id uint))
  (ok (map-get? loan-state loan-id))
)

(define-read-only (get-total-owed (loan-id uint))
  (let ((loan (unwrap! (map-get? loan-state loan-id) ERR-LOAN-NOT-FOUND)))
    (ok (get total-owed loan))
  )
)

(define-read-only (is-defaultable (loan-id uint))
  (let ((loan (unwrap! (map-get? loan-state loan-id) ERR-LOAN-NOT-FOUND)))
    (ok (and
      (is-eq (get status loan) "active")
      (>= block-height (get due-height loan))
    ))
  )
)

(define-read-only (calc-owed (principal uint) (rate-bps uint) (duration-days uint))
  (let ((interest (calc-interest principal rate-bps duration-days)))
    (ok { principal: principal, interest: interest, total: (+ principal interest) })
  )
)
