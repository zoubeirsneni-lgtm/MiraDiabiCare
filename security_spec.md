# MiraDiabiCare Security Specification

## 1. Data Invariants
- A `Log` MUST always have a `userId` that matches the authenticated user.
- A user can only read and write their own `User` profile.
- A user can only read and write their own `Log` documents.
- Admin status cannot be self-assigned.
- `timestamp` MUST be the server time.
- `value` MUST be positive where applicable.

## 2. The "Dirty Dozen" Payloads (Attacker Payloads)

### User Profile Attacks
1. **Identity Spoofing**: Creating/Updating `users/attacker_uid` with `name: "Victim"`.
2. **Privilege Escalation**: Updating `users/my_uid` with `{ "isAdmin": true }`.
3. **Ghost Field Injection**: Updating `users/my_uid` with `{ "is_verified_by_doctor": true }`.

### Log Attacks
4. **Log Hijacking**: Creating `logs/some_id` with `userId: "victim_uid"`.
5. **Orphaned Writes**: Creating a log with a non-existent `userId`.
6. **Timestamp Spoofing**: Creating a log with `timestamp: "2020-01-01"`.
7. **Negative Values**: Creating a glucose log with `value: -50`.
8. **Massive Payload**: Creating a log with a 1MB `notes` string.
9. **Query Scraping**: Authenticated user trying to list all logs: `logs.where("type", "==", "glucose")` without filtering by `userId`.
10. **Admin Bypass**: Trying to access `users` collection without being in the `admins` list.
11. **Cross-User Delete**: Deleting a log belonging to another user.
12. **Type Overwrite**: Updating a `glucose` log and changing its `type` to `food`.

## 3. Test Runner Plan
The rules will be verified using ESLint and the security logic gates (Identity, Integrity, State).
