;; ============================================================
;; ACREDO — nft-escrow.clar
;; Locks NFT collateral during a loan.
;; Releases to borrower on repayment.
;; Transfers to lender on default.
;; LTV = 40% of floor price (enforced here).
;; ============================================================

;; ─── CONSTANTS ───────────────────────────────────────────────

(define-constant CONTRACT-OWNER tx-sender)

(define-constant ERR-NOT-OWNER          (err u500))
(define-constant ERR-NOT-AUTHORISED     (err u501))
(define-constant ERR-ALREADY-LOCKED     (err u502))
(define-constant ERR-NOT-LOCKED         (err u503))
(define-constant ERR-NOT-BORROWER       (err u504))
(define-constant ERR-EXCEEDS-LTV        (err u505))
(define-constant ERR-ZERO-FLOOR         (err u506))
(define-constant ERR-LOAN-NOT-FOUND     (err u507))
(define-constant ERR-NOT-DEFAULTED      (err u508))
(define-constant ERR-NOT-ACTIVE         (err u509))
(define-constant ERR-CALL-FAILED        (err u510))
(define-constant ERR-POOL-FAILED        (err u511))

;; LTV = 40% expressed as basis points (4000 / 10000)
(define-constant LTV-BPS u4000)

;; ─── DATA MAPS ───────────────────────────────────────────────

;; Escrow record: nft-id (string) → escrow details
(define-map escrow
  (string-ascii 64)
  {
    borrower:        principal,
    lender:          (optional principal),
    floor-price:     uint,       ;; micro-sBTC floor price at time of lock
    borrow-amount:   uint,       ;; micro-sBTC borrowed
    loan-id:         uint,
    start-height:    uint,
    due-height:      uint,
    status:          (string-ascii 10)  ;; "locked" | "released" | "liquidated"
  }
)

;; Authorised callers (loan-factory, loan contracts)
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

;; max-borrow = floor-price × LTV-BPS / 10000
(define-private (calc-max-borrow (floor-price uint))
  (/ (* floor-price LTV-BPS) u10000)
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

;; ─── PUBLIC FUNCTIONS ────────────────────────────────────────

;; Lock an NFT as collateral and draw a loan from the liquidity pool
;; floor-price is provided by the caller (oracle / frontend) in micro-sBTC
;; borrow-amount must be <= floor-price × 0.40
(define-public (lock-nft
  (nft-id (string-ascii 64))
  (floor-price uint)
  (borrow-amount uint)
  (loan-id uint)
  (duration-days uint)
)
  (begin
    (asserts! (> floor-price u0) ERR-ZERO-FLOOR)
    (asserts! (is-none (map-get? escrow nft-id)) ERR-ALREADY-LOCKED)

    ;; Enforce LTV
    (let ((max-borrow (calc-max-borrow floor-price)))
      (asserts! (<= borrow-amount max-borrow) ERR-EXCEEDS-LTV)

      (let ((due-height (+ block-height (* duration-days u144))))
        ;; In production: (try! (contract-call? .nft-contract transfer nft-id tx-sender (as-contract tx-sender)))

        ;; Disburse from lending pool
        (unwrap! (contract-call? .liquidity-pool disburse-sbtc tx-sender borrow-amount) ERR-POOL-FAILED)

        ;; Record escrow
        (map-set escrow nft-id {
          borrower:      tx-sender,
          lender:        none,
          floor-price:   floor-price,
          borrow-amount: borrow-amount,
          loan-id:       loan-id,
          start-height:  block-height,
          due-height:    due-height,
          status:        "locked"
        })

        (ok nft-id)
      )
    )
  )
)

;; Borrower repays — NFT released back to them
(define-public (release-nft (nft-id (string-ascii 64)))
  (let (
    (record (unwrap! (map-get? escrow nft-id) ERR-NOT-LOCKED))
  )
    (asserts! (is-eq tx-sender (get borrower record)) ERR-NOT-BORROWER)
    (asserts! (is-eq (get status record) "locked") ERR-NOT-ACTIVE)

    ;; Repayment to pool
    (unwrap! (contract-call? .liquidity-pool receive-repayment-sbtc (get borrow-amount record)) ERR-CALL-FAILED)

    ;; In production: (try! (contract-call? .nft-contract transfer nft-id (as-contract tx-sender) tx-sender))

    (map-set escrow nft-id (merge record { status: "released" }))
    (ok nft-id)
  )
)

;; Liquidate — callable by anyone after due-height passes unpaid
;; Transfers NFT to lender (or protocol if no lender set)
(define-public (liquidate-nft (nft-id (string-ascii 64)))
  (let (
    (record (unwrap! (map-get? escrow nft-id) ERR-NOT-LOCKED))
  )
    (asserts! (is-eq (get status record) "locked") ERR-NOT-ACTIVE)
    (asserts! (>= block-height (get due-height record)) ERR-NOT-DEFAULTED)

    ;; In production: transfer NFT to lender or CONTRACT-OWNER
    ;; (try! (contract-call? .nft-contract transfer nft-id (as-contract tx-sender) recipient))

    (map-set escrow nft-id (merge record { status: "liquidated" }))
    (ok nft-id)
  )
)

;; ─── READ-ONLY ────────────────────────────────────────────────

(define-read-only (get-escrow (nft-id (string-ascii 64)))
  (ok (map-get? escrow nft-id))
)

(define-read-only (get-max-borrow (floor-price uint))
  (ok (calc-max-borrow floor-price))
)

(define-read-only (is-liquidatable (nft-id (string-ascii 64)))
  (let ((record (unwrap! (map-get? escrow nft-id) ERR-NOT-LOCKED)))
    (ok (and
      (is-eq (get status record) "locked")
      (>= block-height (get due-height record))
    ))
  )
)
