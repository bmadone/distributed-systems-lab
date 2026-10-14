import { matcherDone, sorterDone } from '../signals';
import { defineLesson } from '../types';

export default defineLesson({
  id: "sd-security",
  part: "sd",
  title: "Security fundamentals",
  minutes: 12,
  objectives: ["Map controls to confidentiality, integrity and availability","Explain authentication vs authorization, and how TLS and OAuth work","Match common threats to their mitigations"],
  predict: { q: "During a TLS handshake, which kind of encryption protects the bulk of the data afterward?", opts: ["Asymmetric (RSA) for every packet","Symmetric session keys (such as AES)","Hashing only","None"], a: 1, reveal: "Asymmetric cryptography is slow, so TLS uses it only to authenticate the server and agree on keys. Then it switches to fast symmetric encryption." },
  practice: [
    { kind: 'task', text: "Classify every control by the part of CIA it protects.", check: s => sorterDone(s, 'cia') },
    { kind: 'task', text: "Match every threat to its main mitigation.", check: s => matcherDone(s, 'th') },
    { kind: 'num', text: "An attacker with a fast-hash cracking rig tries 10 billion guesses a second against a random 8-character password drawn from 62 characters (a–z, A–Z, 0–9). How many hours to try every combination? (one decimal)", answer: 6.1, tol: 0.2, unit: "hours" },
    { kind: 'num', text: "A passphrase of 6 words picked uniformly at random from a 7,776-word list has how many bits of entropy? (one decimal)", answer: 77.6, tol: 0.3, unit: "bits" },
    { kind: 'num', text: "A botnet tests 1 million leaked username and password pairs against your login, but your rate limit allows 20 attempts a second in total. How many hours to try each pair once? (one decimal)", answer: 13.9, tol: 0.2, unit: "hours" },
    { kind: 'num', text: "A 6-digit one-time code is accepted for 30 seconds, and you lock the account after 5 wrong attempts in that window. Guessing blindly, an attacker succeeds once in how many tries of this kind?", answer: 200000, tol: 0, unit: "windows" },
    { kind: 'num', text: "A 200 Gbps flood is spread evenly across 40 CDN edge locations. How much traffic does each edge location absorb?", answer: 5, tol: 0.05, unit: "Gbps" },
    { kind: 'num', text: "Your database has 2 million users. An attacker has a list of 5,000 common passwords. With <b>no salt</b> one pass of 5,000 hashes checks everyone at once. With a <b>unique salt per user</b>, how many hashes does the full attack need?", answer: 10000000000, tol: 0, unit: "hashes" },
    { kind: 'num', text: "bcrypt&apos;s cost parameter is a power of two: each increase of 1 doubles the work. Raising the cost from 10 to 13 makes every password check how many times slower?", answer: 8, tol: 0, unit: "×" },
  ],
  quiz: [
    { q: "A logged-in user changes the URL /invoices/123 to /invoices/124 and sees someone else’s invoice. What failed?", opts: ["Authentication","Authorization","Encryption at rest","Rate limiting"], a: 1, why: "The system knew who the user was but didn’t check whether they could access that invoice." },
    { q: "How should passwords be stored?", opts: ["Encrypted with AES","Hashed with SHA-256","Hashed with a slow, salted algorithm like bcrypt or Argon2","In plain text behind a firewall"], a: 2, why: "Slow, salted hashes make brute-forcing a stolen database very expensive." },
    { q: "OAuth 2.0 mainly provides…", opts: ["Password storage","Delegated authorization through access tokens","Disk encryption","Load balancing"], a: 1, why: "Apps get scoped, revocable tokens instead of your password. OpenID Connect adds identity." },
    { q: "A malicious site makes a logged-in user&apos;s browser silently submit a funds-transfer form to a bank, and the browser attaches its cookies. Which defence targets this attack?", opts: ["Parameterized queries","Output encoding","SameSite cookies and anti-CSRF tokens","Salted password hashing"], a: 2, why: "This is cross-site request forgery: the browser sends credentials automatically. SameSite cookies and per-session tokens make sure the request really came from your own pages. The other options stop injection and credential theft, not forged requests." },
    { q: "Which is NOT something a per-user salt gives you?", opts: ["Identical passwords produce different stored hashes","Precomputed rainbow tables stop working","The attacker must crack each user separately","Each individual guess becomes slower to compute"], a: 3, why: "A salt makes hashes unique, which defeats precomputation and shared cracking. Making each guess slow is the job of the work factor in bcrypt, scrypt or Argon2." },
    { q: "Why are OAuth access tokens normally short-lived?", opts: ["Long tokens can&apos;t be encrypted","A stolen bearer token works for whoever holds it, so a short lifetime limits the damage window","Short tokens are faster to verify","The protocol forbids tokens longer than an hour"], a: 1, why: "Bearer tokens carry no proof of who is presenting them, so theft equals access until expiry or revocation. A refresh token, kept more carefully, lets the client get new access tokens." },
    { q: "How does mutual TLS between two services differ from ordinary TLS?", opts: ["Both sides present certificates, so the server also verifies the client","Only the client verifies the server, as on the public web","It uses only asymmetric encryption for all data","It turns off encryption to improve speed"], a: 0, why: "In ordinary TLS only the server proves its identity. Mutual TLS adds a client certificate, giving each service a cryptographic identity, which is useful for service-to-service authentication." },
    { q: "An attacker steals a physical disk from a database server. Which control protects the data best?", opts: ["TLS between application and database","Encryption at rest, with keys kept in a separate key management service","Rate limiting on the API","CSRF tokens"], a: 1, why: "Encryption at rest protects data on stolen media, but only if the key is not stored on the same disk. TLS protects data in motion, and the other controls don&apos;t apply to stolen storage." },
    { q: "A nightly reporting job needs to read two tables. Which credential follows least privilege?", opts: ["The application&apos;s read-write account","A dedicated read-only role limited to those two tables","The database administrator account, so it never fails","A shared account used by all batch jobs"], a: 1, why: "Least privilege means giving each identity only the access it needs. A narrow, dedicated role limits what a leaked or buggy job can read or change, and makes audits easier." },
    { q: "You need data integrity, plus proof that a specific publisher created it, verifiable by anyone with a public key. What fits?", opts: ["A plain SHA-256 hash","A digital signature","Symmetric encryption alone","Base64 encoding"], a: 1, why: "A plain hash can be recomputed by anyone, so it proves nothing about who made the data. A signature made with a private key can be verified with the public key. Encryption alone doesn&apos;t prove integrity or origin." },
  ],
  explain: { prompt: "Explain the difference between authentication and authorization with an example.", model: "Authentication proves who you are, like logging in with a password and MFA. Authorization decides what you can do, like whether you may view invoice 124. You can be authenticated and still not authorized." },
  takeaways: ["CIA: confidentiality, integrity, availability.","Authentication is identity, authorization is permission. Check permission on every request.","TLS uses asymmetric crypto to agree on fast symmetric keys.","Parameterized queries, output encoding and rate limiting stop the most common attacks."],
  cards: [
    ["Authentication vs authorization", "Who you are / what you’re allowed to do."],
    ["Symmetric vs asymmetric encryption", "One shared key, fast / public-private key pair, used for key exchange and signatures."],
    ["SQL injection fix", "Parameterized queries or prepared statements. Never concatenate user input into SQL."],
  ],
});
