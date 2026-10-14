import { Matcher, Sorter } from '../ui/Exercises';
import { Prose } from '../ui/primitives';

const SdSecurityBody = () => (
  <>
    <Prose>
      <p>The <b>CIA triad</b> sets security goals: <b>Confidentiality</b> (only authorized parties can read), <b>Integrity</b> (data can&apos;t be changed without detection) and <b>Availability</b> (the system stays usable, including under attack).</p>
      <ul>
        <li><b>Authentication</b> answers &quot;who are you?&quot; with passwords plus MFA, passkeys, OpenID Connect, or mutual TLS between services. <b>Authorization</b> answers &quot;what are you allowed to do?&quot; with role-based or attribute-based access control. Apply <b>least privilege</b>.</li>
        <li><b>Symmetric encryption</b> (AES) uses one shared key and is fast. <b>Asymmetric encryption</b> (RSA, elliptic curves) uses a public and private key pair, for exchanging keys and making <b>digital signatures</b>. <b>Hashing</b> (SHA-256) is one-way and detects tampering. Store passwords with slow, salted hashes such as bcrypt or Argon2.</li>
        <li><b>TLS</b> uses asymmetric cryptography during the handshake to agree on symmetric session keys. The server proves who it is with a certificate signed by a trusted authority (<b>PKI</b>). Encrypt data <b>in transit</b> (TLS everywhere) and <b>at rest</b> (keys in a key management service).</li>
        <li><b>OAuth 2.0</b> is delegated authorization. An app gets a limited, revocable access token instead of your password. <b>OpenID Connect</b> adds identity on top of it.</li>
      </ul>
    </Prose>
    <Sorter id="cia" title="Which part of CIA does it protect?" />
    <Matcher id="th" title="Match threats to mitigations" />
  </>
);

export default SdSecurityBody;
