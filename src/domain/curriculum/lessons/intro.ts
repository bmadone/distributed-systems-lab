import { sorterDone } from '../signals';
import { defineLesson } from '../types';

export default defineLesson({
  id: "intro",
  part: "found",
  title: "Why distributed systems are hard",
  minutes: 8,
  objectives: ["Name the three things that make distributed systems hard","Tell safety properties from liveness properties"],
  predict: { q: "A server sent a request to another server 5 seconds ago and has no reply. What can it conclude?", opts: ["The other server crashed","The network dropped the request","Nothing for certain","The request succeeded"], a: 2, reveal: "Any of these could be true: the request was lost, the server is slow or crashed, or it succeeded and the reply was lost. That uncertainty is the main theme of this course." },
  practice: [
    { kind: 'task', text: "Sort all 12 guarantees correctly as safety or liveness.", check: s => sorterDone(s, 'sl') },
    { kind: 'num', text: "You run 100 servers, and each is independently down 1% of the time. What’s the chance at least one is down right now, in %? (nearest whole number)", answer: 63, tol: 1, unit: "%" },
    { kind: 'num', text: "A request needs 5 services in series, and each is up 99.9% of the time, independently. What is the availability of the whole chain, in %? (two decimals)", answer: 99.5, tol: 0.05, unit: "%" },
    { kind: 'num', text: "You run 20 servers, and each is independently down 2% of the time. What’s the chance that at least one is down right now, in %?", answer: 33.2, tol: 0.5, unit: "%" },
    { kind: 'num', text: "Each message is lost independently with probability 20%. A request and its reply must both arrive for one attempt to succeed. On average, how many attempts does the client need until one succeeds? (two decimals)", answer: 1.56, tol: 0.02 },
    { kind: 'num', text: "A datacenter has 5,000 machines. Each fails on average once every 3 years (1 year = 365 days). On average, how many hours pass between failures somewhere in the fleet?", answer: 5.26, tol: 0.05, unit: "hours" },
    { kind: 'num', text: "Two clocks each drift up to 50 parts per million, in opposite directions, so they separate at 100 ppm. They start in sync. How many seconds until they differ by 10 ms?", answer: 100, tol: 1, unit: "s" },
    { kind: 'num', text: "The same two clocks (separating at 100 ppm) are never corrected. By how many seconds do they disagree after one day?", answer: 8.64, tol: 0.05, unit: "s" },
  ],
  quiz: [
    { q: "\"No two nodes ever hold the same lock at the same time\" is a…", opts: ["Safety property","Liveness property","Performance property","Availability property"], a: 0, why: "It forbids something bad, and a violation happens at a specific moment." },
    { q: "Which is NOT one of the core difficulties of distributed systems?", opts: ["Partial failure","Unreliable network","No global clock","Programming languages are too slow"], a: 3, why: "The hard parts come from failure, the network and time, not from language speed." },
    { q: "Why distribute a system at all?", opts: ["Scale, fault tolerance and latency","It’s always simpler","It removes the need for testing","It guarantees consistency"], a: 0, why: "Distribution buys scale, resilience and proximity to users, at the cost of complexity." },
    { q: "Which statement is a liveness property?", opts: ["A transaction that has started eventually commits or aborts","No payment is ever debited twice","Replicas never apply writes in different orders","A released lock is never held by two clients"], a: 0, why: "Liveness promises that something good will happen eventually. The other three forbid a bad state, so each is a safety property that a single bad moment would break." },
    { q: "Why is partial failure harder to handle than a whole machine crashing?", opts: ["The surviving parts can’t tell what state the failed part is in or whether it is still working","Partial failures corrupt data more often","Partial failures can’t be retried","Partial failures are always faster to detect"], a: 0, why: "On one machine a crash takes everything down together. In a distributed system some parts continue, and the rest only see silence, so they must act on a guess." },
    { q: "Server A logs an event at 12:00:00.100 by its own clock. Server B logs another at 12:00:00.050 by its own clock. What can you say about which happened first?", opts: ["Nothing definite if the clocks may differ by more than 50 ms","B’s event happened first","A’s event happened first","They happened at the same moment"], a: 0, why: "Each machine’s clock has its own offset and drift. When the timestamps are closer than the possible error, the order is unknown. Later lessons use logical clocks for this." },
    { q: "Each of 100 servers is independently down 1% of the time. About how often are all 100 up at the same moment?", opts: ["About 99% of the time","About 37% of the time","About 63% of the time","About 1% of the time"], a: 1, why: "All-up probability is 0.99 to the 100th power, about 0.37. So in a large fleet something is usually broken, and the design has to treat failure as normal." },
    { q: "Your data fits on one machine and traffic is modest. Which is the strongest remaining reason to distribute it?", opts: ["Fault tolerance and lower latency for faraway users","Distributed systems are always faster","It removes the need for backups","It makes consistency simpler"], a: 0, why: "Copies in several machines or regions survive failures and sit close to users. It does not make things faster per request, it does not replace backups, and it makes consistency harder." },
    { q: "During a network partition, an algorithm stops answering requests until the partition heals so that it never returns conflicting results. Which kind of property did it give up for now?", opts: ["Liveness","Safety","Both safety and liveness","Neither"], a: 0, why: "It chose to stay correct rather than make progress. That is the usual trade: safety always, liveness only while the network allows it." },
    { q: "Why can you never point to the exact moment a liveness property is violated?", opts: ["\"Eventually\" may still arrive later, so the good thing could still happen","Liveness properties are only probabilistic","Clocks disagree about when it happened","Liveness failures are never written to logs"], a: 0, why: "A safety violation is a finite event you can find in a trace. A liveness property only fails in the infinite run where the good thing never comes, so no finite prefix proves it." },
  ],
  explain: { prompt: "In your own words: what makes a distributed system harder than a program on one machine?", model: "Parts fail independently and you often can’t tell which ones. Messages can be lost, delayed or duplicated. There’s no shared clock to say what happened first. A single machine hides all three." },
  takeaways: ["Partial failure, unreliable networks and no shared clock are the root difficulties.","Safety means nothing bad ever happens. Liveness means something good eventually happens.","Good algorithms always keep safety and give liveness when the network behaves."],
  cards: [
    ["Safety property", "Something bad never happens. A violation can be pinned to a moment."],
    ["Liveness property", "Something good eventually happens."],
    ["Partial failure", "Some components fail while others keep working, often without anyone knowing which."],
  ],
});
