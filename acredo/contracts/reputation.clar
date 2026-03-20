;; ============================================================
;; ACREDO - reputation.clar
;; Stores on-chain reputation scores, tiers, and default history.
;; All other contracts read from this one. Nothing calls OUT from here.
;; ============================================================

;; --- CONSTANTS -----------------------------------------------

(define-constant CONTRACT-OWNER tx-sender)

(define-constant ERR-NOT-OWNER        (err u100))
(define-constant ERR-NOT-AUTHORISED   (err u101))
(define-constant ERR-INVALID-SCORE    (err u102))
(define-constant ERR-NO-SCORE         (err u103))

;; Tier thresholds (inclusive lower bound)
(define-constant TIER-A-MIN u750)
(define-constant TIER-B-MIN u500)
(define-constant TIER-C-MIN u250)

;; Borrow limits per tier (in micro-sBTC, 1 sBTC = 1_000_000)
(define-constant BORROW-LIMIT-A u5000000)   ;; 5 sBTC
(define-constant BORROW-LIMIT-B u2000000)   ;; 2 sBTC
(define-constant BORROW-LIMIT-C u500000)    ;; 0.5 sBTC
(define-constant BORROW-LIMIT-D u0)         ;; restricted

;; Default penalty applied to score
(define-constant DEFAULT-PENALTY u100)

;; --- DATA MAPS -----------------------------------------------

;; Primary score store: principal -> score (0-1000)
(define-map scores
  principal
  { score: uint, defaults: uint }
)

;; Authorised writers (loan contract will be added here)
(define-map authorised-writers principal bool)

;; --- PRIVATE HELPERS -----------------------------------------

(define-private (is-owner)
  (is-eq tx-sender CONTRACT-OWNER)
)

(define-private (is-authorised)
  (or
    (is-owner)
    (default-to false (map-get? authorised-writers tx-sender))
  )
)

(define-private (score-to-tier (score uint))
  (if (>= score TIER-A-MIN)
    "A"
    (if (>= score TIER-B-MIN)
      "B"
      (if (>= score TIER-C-MIN)
        "C"
        "D"
      )
    )
  )
)

(define-private (tier-to-borrow-limit (tier (string-ascii 1)))
  (if (is-eq tier "A")
    BORROW-LIMIT-A
    (if (is-eq tier "B")
      BORROW-LIMIT-B
      (if (is-eq tier "C")
        BORROW-LIMIT-C
        BORROW-LIMIT-D
      )
    )
  )
)

;; --- ADMIN ---------------------------------------------------

;; Grant write access to a contract (e.g. loan.clar)
(define-public (add-authorised-writer (writer principal))
  (begin
    (asserts! (is-owner) ERR-NOT-OWNER)
    (map-set authorised-writers writer true)
    (ok true)
  )
)

;; Revoke write access
(define-public (remove-authorised-writer (writer principal))
  (begin
    (asserts! (is-owner) ERR-NOT-OWNER)
    (map-delete authorised-writers writer)
    (ok true)
  )
)

;; --- WRITE FUNCTIONS -----------------------------------------

;; Set or update a user's reputation score (0-1000)
;; Called by off-chain oracle or admin after computing score
(define-public (store-score (user principal) (score uint))
  (begin
    (asserts! (is-authorised) ERR-NOT-AUTHORISED)
    (asserts! (<= score u1000) ERR-INVALID-SCORE)
    (let ((existing (default-to { score: u0, defaults: u0 } (map-get? scores user))))
      (map-set scores user {
        score: score,
        defaults: (get defaults existing)
      })
    )
    (ok score)
  )
)

;; Record a default event - reduces score and increments default counter
;; Called by loan.clar when a loan passes its deadline unpaid
(define-public (record-default (user principal))
  (begin
    (asserts! (is-authorised) ERR-NOT-AUTHORISED)
    (let (
      (existing (default-to { score: u0, defaults: u0 } (map-get? scores user)))
      (current-score (get score existing))
      (new-score (if (>= current-score DEFAULT-PENALTY)
                   (- current-score DEFAULT-PENALTY)
                   u0))
    )
      (map-set scores user {
        score: new-score,
        defaults: (+ (get defaults existing) u1)
      })
      (ok new-score)
    )
  )
)

;; --- READ-ONLY FUNCTIONS -------------------------------------

;; Get raw score and default count for a user
(define-read-only (get-score (user principal))
  (ok (default-to { score: u0, defaults: u0 } (map-get? scores user)))
)

;; Get tier string: "A" | "B" | "C" | "D"
(define-read-only (get-tier (user principal))
  (let ((data (default-to { score: u0, defaults: u0 } (map-get? scores user))))
    (ok (score-to-tier (get score data)))
  )
)

;; Get borrow limit in micro-sBTC based on current tier
(define-read-only (get-borrow-limit (user principal))
  (let (
    (data (default-to { score: u0, defaults: u0 } (map-get? scores user)))
    (tier (score-to-tier (get score data)))
  )
    (ok (tier-to-borrow-limit tier))
  )
)

;; Get full profile: score + tier + borrow-limit + defaults
(define-read-only (get-profile (user principal))
  (let (
    (data (default-to { score: u0, defaults: u0 } (map-get? scores user)))
    (score (get score data))
    (tier (score-to-tier score))
  )
    (ok {
      score: score,
      tier: tier,
      borrow-limit: (tier-to-borrow-limit tier),
      defaults: (get defaults data)
    })
  )
)

;; Check if a user is authorised to write (for debugging / UI)
(define-read-only (is-writer (writer principal))
  (ok (default-to false (map-get? authorised-writers writer)))
)
