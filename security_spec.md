# Security Specification for SiteScope

## Data Invariants
1. A user can only read, create, update, or delete their own analysis records under `/users/{userId}/analyses/{analysisId}`.
2. The user profile at `/users/{userId}` is strictly private and only accessible by the authenticated user with matching `uid`.
3. Anonymous or unauthenticated users cannot access or alter any user-specific persisted analysis reports in Firestore.
4. Document IDs and user IDs must adhere to standard alphanumeric and dash/underscore constraints (`isValidId`) with a maximum length of 128 characters.
5. All persisted analysis records must include valid URLs (max 500 characters), domain names (max 200 characters), and valid strategies ('mobile' | 'desktop').
