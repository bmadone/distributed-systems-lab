import { sorterDone } from '../signals';
import { defineLesson } from '../types';

export default defineLesson({
  id: "failures",
  part: "found",
  title: "Failures & system models",
  minutes: 12,
  objectives: ["Classify failures as crash-stop, crash-recovery, omission or Byzantine","Explain the synchronous, asynchronous and partially synchronous timing models","Reason about failure detector timeouts"],
  predict: { q: "You shorten a failure detector’s timeout from 5 s to 200 ms. What’s the main risk?", opts: ["Slower detection","Healthy-but-slow nodes get declared dead","More memory use","No risk"], a: 1, reveal: "Short timeouts catch crashes quickly but also flag nodes that are only paused, for example by garbage collection, which can trigger needless failovers." },
  practice: [
    { kind: 'task', text: "Set a timeout with <b>zero</b> false suspicions.", check: ({ failureDetector: f }) => f !== undefined && f.falseCount === 0 },
    { kind: 'task', text: "Find a timeout with <b>at most 2</b> false suspicions that still detects a crash <b>within 1 second</b>.", check: ({ failureDetector: f }) => f !== undefined && f.falseCount <= 2 && f.T <= 1000 },
    { kind: 'task', text: "Diagnose all ten incidents correctly.", check: s => sorterDone(s, 'dx') },
    { kind: 'task', text: "Find a timeout that detects a crash within <b>0.5 seconds</b> (500 ms or less) with <b>at most 4</b> false suspicions.", check: ({ failureDetector: f }) => f !== undefined && f.T <= 500 && f.falseCount <= 4 },
    { kind: 'task', text: "Set a timeout that gives <b>exactly 3</b> false suspicions: you have to skip past some of the garbage-collection pauses but not all of them.", check: ({ failureDetector: f }) => f !== undefined && f.falseCount === 3 },
    { kind: 'num', text: "A service checks a node once per second. With a 700 ms timeout, what share of the lab’s 200 heartbeats is wrongly flagged? Use that rate to estimate false alarms from <b>one</b> node over one hour (3,600 checks).", answer: 54, tol: 2, unit: "false alarms" },
    { kind: 'num', text: "A fleet of 500 nodes is checked every 10 s. Each check wrongly flags a healthy node with probability 0.2%. How many false alarms does the fleet see per hour?", answer: 360, tol: 1, unit: "alarms" },
    { kind: 'task', text: "Find the <b>longest-patience</b> setting that still shows a false suspicion: set a timeout with <b>exactly 1</b> false suspicion.", check: ({ failureDetector: f }) => f !== undefined && f.falseCount === 1 },
    { kind: 'num', text: "A leader crash is noticed after a 1.5 s timeout, the election takes 800 ms, and clients need 300 ms to reconnect. The leader crashes 4 times a month. How many seconds of unavailability per month?", answer: 10.4, tol: 0.1, unit: "s" },
  ],
  quiz: [
    { q: "A server restarts after a power loss and has lost everything that was only in memory. Which failure model is this?", opts: ["Crash-stop","Crash-recovery","Byzantine","Omission"], a: 1, why: "It comes back, so it isn’t crash-stop, and it loses state that wasn’t saved to disk." },
    { q: "Most practical consensus algorithms assume which timing model?", opts: ["Synchronous","Asynchronous","Partially synchronous","None"], a: 2, why: "They stay safe at all times and make progress once the network settles down." },
    { q: "Why can’t a perfect failure detector exist in an asynchronous system?", opts: ["Clocks are too slow","You can’t tell a slow node from a crashed one","Networks are encrypted","Nodes are Byzantine"], a: 1, why: "Without time bounds, any timeout can be wrong." },
    { q: "A NIC fault means a node keeps running but about one in ten of its outgoing messages is silently dropped. Which failure model is this?", opts: ["Omission","Crash-stop","Crash-recovery","Byzantine"], a: 0, why: "The node is alive and behaves correctly, but some messages never get through. Omission faults are common in real networks and are easy to mistake for a crash." },
    { q: "Why do blockchains design for Byzantine faults while most datacenter databases do not?", opts: ["Blockchain participants don’t trust each other, but nodes inside one organization run trusted code","Datacenter hardware never misbehaves","Byzantine tolerance is impossible with fewer than 100 nodes","Blockchains have no clocks"], a: 0, why: "Byzantine tolerance costs more nodes, more messages and complexity. It is worth paying when a participant may lie on purpose. Inside one company the usual assumption is crash faults, with checksums and monitoring for accidental corruption." },
    { q: "You raise a failure detector’s timeout from 1 s to 10 s. What changes?", opts: ["Fewer false suspicions, but a real crash takes longer to notice","More false suspicions, and crashes are noticed sooner","Nothing, because heartbeats are reliable","The detector becomes perfect"], a: 0, why: "A longer timeout tolerates slower heartbeats, so fewer healthy nodes are flagged, but every real crash costs clients the whole longer wait. No setting avoids both problems." },
    { q: "A leader pauses for 4 s of garbage collection while followers use a 3 s timeout. They elect a new leader, then the old one wakes up still believing it leads. What is the root problem?", opts: ["A false suspicion, and the old leader doesn’t know it was replaced","The nodes are Byzantine","The followers should never use timeouts","The network lost the election message"], a: 0, why: "A slow node looks dead to a timeout, so the cluster made a reasonable but wrong choice. Protocols guard against the resulting stale leader with terms or fencing tokens that make old leaders’ writes rejected." },
    { q: "A monitor expects a heartbeat every 2 s and declares a node dead after 3 consecutive misses. The node crashes right after sending a heartbeat. About when is it declared dead?", opts: ["About 6 s later","About 2 s later","About 3 s later","About 12 s later"], a: 0, why: "The first miss is noticed at about 2 s, the second at 4 s and the third at 6 s. Detection time is the interval times the number of misses you require, so extra patience is paid for in latency." },
    { q: "Which extra requirement does the crash-recovery model put on an algorithm, compared with crash-stop?", opts: ["Keep important state on stable storage and handle restarted nodes with old state","Tolerate nodes that lie","Assume messages arrive within a fixed bound","Avoid using timeouts"], a: 0, why: "A node that returns after a crash must know what it promised before. Anything that was only in memory is gone, so protocols write votes and logs to disk before replying." },
    { q: "What does the FLP result say?", opts: ["In a purely asynchronous system, no deterministic algorithm can guarantee consensus if even one node may crash","Consensus is impossible in every system model","Consensus needs synchronized clocks","Consensus needs at least 3f+1 nodes to tolerate f crashes"], a: 0, why: "FLP is about guaranteeing termination without any timing assumptions. Practical protocols like Raft and Paxos keep safety always and rely on timeouts (partial synchrony) or randomness to make progress. The 3f+1 figure belongs to Byzantine tolerance." },
  ],
  explain: { prompt: "Explain why choosing a timeout is always a trade-off.", model: "A short timeout detects real crashes quickly but wrongly declares slow nodes dead. A long timeout avoids false alarms but leaves clients waiting on a dead node. There’s no value that’s always right, because delays have no fixed upper bound." },
  takeaways: ["Crash-recovery is the realistic default, and Byzantine is for untrusted settings.","Partial synchrony: always safe, makes progress when things are calm.","Timeouts trade detection speed against false alarms."],
  cards: [
    ["Crash-recovery failure", "The node halts, restarts later, and may lose in-memory state."],
    ["Byzantine failure", "A node behaves arbitrarily, even maliciously."],
    ["Partially synchronous model", "Timing bounds exist but may be broken for a while. Algorithms stay safe and make progress once bounds hold."],
  ],
});
