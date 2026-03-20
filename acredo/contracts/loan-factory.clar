;; ============================================================
;; ACREDO - loan-factory.clar
;; Creates and indexes loan instances.
;; Checks reputation limits before allowing loan creation.
;; Calls liquidity-pool.clar to disburse funds.
;; ============================================================

;; --- CONSTANTS -----------------------------------------------

(define-constant CONTRACT-OWNER tx-sender)

(define-constant ERR-NOT-OWNER           (err u300))
(define-constant ERR-NO-BNS              (err u301))
(define-constant ERR-BELOW-LIMIT         (err u302))
(define-constant ERR-EXCEEDS-LIMIT       (err u303))
(define-constant ERR-INVALID-DURATION    (err u304))
(define-constant ERR-INVALID-RATE        (err u305))
(define-constant ERR-ZERO-AMOUNT         (err u306))
(define-constant ERR-LOAN-EXISTS         (err u307))
(define-constant ERR-POOL-CALL-FAILED    (err u308))

;; Duration bounds (days, stored as blocks - approx 144 blocks/day on Stacks)
(define-constant BLOCKS-PER-DAY u144)
(define-constant MIN-DURATION-DAYS u7)
(define-constant MAX-DURATION-DAYS u365)

;; Rate bounds (basis points: 500 = 5%, 3000 = 30%)
(define-constant MIN-RATE-BPS u500)
(define-constant MAX-RATE-BPS u3000)

;; --- DATA VARS -----------------------------------------------

(define-data-var loan-nonce uint u0)

;; --- DATA MAPS -----------------------------------------------

;; Loan index: loan-id (uint) -> loan metadata
(define-map loans
  uint
  {
    borrower:       principal,
    amount:         uint,        ;; micro-sBTC
    rate-bps:       uint,        ;; e.g. 1400 = 14% APR
    duration-days:  uint,
    start-height:   uint,        ;; block height at creation
    due-height:     uint,        ;; block height at deadline
    status:         (string-ascii 10), ;; "open" | "funded" | "active" | "repaid" | "defaulted"
    lender:         (optional principal)
  }
)

;; Reverse index: borrower -> list of their loan IDs (max 20)
(define-map borrower-loans principal (list 20 uint))

;; Open loan requests index (for marketplace reads)
;; loan-id -> bool (true = open)
(define-map open-loans uint bool)

;; --- PRIVATE HELPERS -----------------------------------------

(define-private (is-owner)
  (is-eq tx-sender CONTRACT-OWNER)
)

(define-private (days-to-blocks (days uint))
  (* days BLOCKS-PER-DAY)
)

(define-private (next-id)
  (let ((id (var-get loan-nonce)))
    (var-set loan-nonce (+ id u1))
    id
  )
)

;; --- PUBLIC FUNCTIONS ----------------------------------------

;; Create a reputation loan request
;; borrower must have sufficient reputation score (checked via reputation.clar)
(define-public (create-loan
  (amount uint)
  (rate-bps uint)
  (duration-days uint)
)
  (begin
    ;; Validate inputs
    (asserts! (> amount u0) ERR-ZERO-AMOUNT)
    (asserts! (>= duration-days MIN-DURATION-DAYS) ERR-INVALID-DURATION)
    (asserts! (<= duration-days MAX-DURATION-DAYS) ERR-INVALID-DURATION)
    (asserts! (>= rate-bps MIN-RATE-BPS) ERR-INVALID-RATE)
    (asserts! (<= rate-bps MAX-RATE-BPS) ERR-INVALID-RATE)

    ;; Check borrow limit from reputation contract
    (let (
      (limit-result (unwrap! (contract-call? .reputation get-borrow-limit tx-sender) ERR-BELOW-LIMIT))
    )
      (asserts! (> limit-result u0) ERR-BELOW-LIMIT)
      (asserts! (<= amount limit-result) ERR-EXCEEDS-LIMIT)

      ;; Create loan record
      (let (
        (loan-id (next-id))
        (due-height (+ block-height (days-to-blocks duration-days)))
      )
        (map-set loans loan-id {
          borrower:       tx-sender,
          amount:         amount,
          rate-bps:       rate-bps,
          duration-days:  duration-days,
          start-height:   block-height,
          due-height:     due-height,
          status:         "open",
          lender:         none
        })

        ;; Add to open index
        (map-set open-loans loan-id true)

        ;; Add to borrower index
        (let ((existing (default-to (list) (map-get? borrower-loans tx-sender))))
          (map-set borrower-loans tx-sender (unwrap! (as-max-len? (append existing loan-id) u20) ERR-LOAN-EXISTS))
        )

        (ok loan-id)
      )
    )
  )
)

;; Lender funds an open loan
;; Triggers disbursement from liquidity pool to borrower
(define-public (fund-loan (loan-id uint))
  (let (
    (loan (unwrap! (map-get? loans loan-id) ERR-BELOW-LIMIT))
  )
    (asserts! (is-eq (get status loan) "open") ERR-LOAN-EXISTS)
    (asserts! (not (is-eq tx-sender (get borrower loan))) ERR-NOT-OWNER)

    ;; Disburse from lending pool
    (let (
      (amount (get amount loan))
      (borrower (get borrower loan))
    )
      (unwrap! (contract-call? .liquidity-pool disburse-sbtc borrower amount) ERR-POOL-CALL-FAILED)

      ;; Update loan status to active
      (map-set loans loan-id (merge loan {
        status: "active",
        lender: (some tx-sender)
      }))

      ;; Remove from open index
      (map-delete open-loans loan-id)

      (ok loan-id)
    )
  )
)

;; --- READ-ONLY ------------------------------------------------

(define-read-only (get-loan (loan-id uint))
  (ok (map-get? loans loan-id))
)

(define-read-only (get-borrower-loans (borrower principal))
  (ok (default-to (list) (map-get? borrower-loans borrower)))
)

(define-read-only (is-loan-open (loan-id uint))
  (ok (default-to false (map-get? open-loans loan-id)))
)

(define-read-only (get-loan-count)
  (ok (var-get loan-nonce))
)
