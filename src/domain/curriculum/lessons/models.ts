import { sorterDone } from '../signals';
import { defineLesson } from '../types';

export default defineLesson({
  id: "models",
  part: "guar",
  title: "Consistency models",
  minutes: 15,
  objectives: ["Define a consistency model as a set of allowed histories","Distinguish linearizable, sequential, causal and eventual consistency","Judge whether a history is linearizable"],
  predict: { q: "Bob replies to Alice’s post. Which model is the weakest that guarantees nobody ever sees the reply without the post?", opts: ["Eventual","Causal","Sequential","Linearizable"], a: 1, reveal: "Causal consistency orders causally related operations: a reply is caused by reading the post. It’s the weakest of these models with that guarantee, and unlike the stronger ones it can stay available during partitions (with sticky clients)." },
  practice: [
    { kind: 'task', text: "Explore all five models in the story lab.", check: ({ models }) => models !== undefined && models.visited.length >= 5 },
    { kind: 'task', text: "Judge every history in the sorter correctly.", check: s => sorterDone(s, 'hj') },
    { kind: 'task', text: "In the story lab, select the <b>weakest</b> model that rules out Carol seeing the post <b>but not the reply yet</b> (the second outcome).", check: ({ models }) => models?.sel === 0 },
    { kind: 'num', text: "Client 1 writes x=1 with the write in flight from 0 to 30 ms. A read from 10 to 15 ms returns 1. In a linearizable history, what is the latest instant (in ms) at which the write can have taken effect?", answer: 15, tol: 0, unit: "ms" },
    { kind: 'task', text: "Select the <b>weakest</b> model that rules out Dave and Erin seeing their posts in <b>opposite orders</b> (the last outcome).", check: ({ models }) => models?.sel === 1 },
    { kind: 'task', text: "Select the weakest model that guarantees Alice <b>always sees her own post</b> and that a reply Carol saw never disappears on refresh.", check: ({ models }) => models?.sel === 3 },
    { kind: 'num', text: "Three clients each perform 2 operations, and a sequentially consistent store may pick any single global order that keeps each client&apos;s own order. How many different global orders exist?", answer: 90, tol: 0, unit: "orders" },
    { kind: 'num', text: "Client P performs 3 operations and client Q performs 2. How many global orders keep each client&apos;s program order?", answer: 10, tol: 0, unit: "orders" },
    { kind: 'num', text: "The lab grid has 5 models and 7 outcomes. Count all the cells marked <b>ruled out</b>, across every model.", answer: 15, tol: 0, unit: "cells" },
  ],
  quiz: [
    { q: "Model A is \"stronger\" than model B when A…", opts: ["Is faster","Allows fewer histories","Uses more replicas","Is newer"], a: 1, why: "Stronger models rule out more behaviors." },
    { q: "Sequential consistency differs from linearizability because it…", opts: ["Allows any order","Doesn’t require matching real time","Ignores program order","Is stronger"], a: 1, why: "There’s still one global order, but it can lag behind wall-clock time." },
    { q: "Which can be implemented while staying available during a partition?", opts: ["Linearizability","Sequential","Causal","None"], a: 2, why: "Causal consistency (with sticky clients) can stay available. Linearizable and sequential consistency can’t." },
    { q: "Alice updates her profile photo, refreshes and still sees the old one. What is the weakest guarantee in the lab that would have prevented this?", opts: ["Eventual consistency","Session guarantees (read-your-writes)","Causal consistency","Linearizability"], a: 1, why: "Read-your-writes concerns only your own session, so it is cheaper than causal or linearizable. A stronger model also prevents the bug, but isn’t needed for this symptom." },
    { q: "Client 1’s write is confirmed at t = 10 ms. Client 2 starts a read at t = 20 ms and returns the old value. Which models allow this history?", opts: ["Sequential consistency and weaker ones, but not linearizability","Only eventual consistency","All four models","None of them, because it is a bug in every model"], a: 0, why: "Linearizability must respect real time, so the read has to see the write. Sequential consistency can order the read before the write in its single global order, because that order needn’t match the clock." },
    { q: "Which property does causal consistency NOT guarantee?", opts: ["A reply is never visible without the post it answers","Two unrelated concurrent writes appear in the same order to every client","A client’s own operations are seen in program order","If you read a value and then write, everyone sees your write after the value you read"], a: 1, why: "Causal consistency orders causally related operations only. Concurrent, unrelated writes may be seen in different orders by different replicas, and that freedom is what lets it stay available." },
    { q: "Why can a linearizable store not stay available on both sides of a partition?", opts: ["A cut-off node cannot know whether it holds the latest confirmed write, so it must refuse or wait","Linearizability requires every node to store identical hardware","The clients on both sides are always lying","Partitions delay only reads"], a: 0, why: "If both sides answered, a client could confirm a write on one side while a read on the other side returned the old value. Staying linearizable means the minority side has to stop answering." },
    { q: "Which configuration is most likely to produce a history that is NOT linearizable?", opts: ["Cassandra reading and writing at ONE","A single-leader store that reads only from a leader confirmed by consensus","etcd linearizable reads","Spanner reads at a strong timestamp"], a: 0, why: "With ONE/ONE the read can contact a replica the write skipped, so it can return an old value after the write completed. The other systems route reads through a leader or consensus, or wait out clock uncertainty." },
    { q: "What does eventual consistency actually promise?", opts: ["If writes stop, replicas converge to the same value","Reads are never more than one second stale","Every client sees writes in the same order","A client always reads its own writes"], a: 0, why: "The guarantee is only about convergence once updates stop. It says nothing about how long that takes, the order clients see, or whether you read your own writes." },
    { q: "A write of x=1 spans 0 to 30 ms. A read spanning 10 to 15 ms returns 1. A different client starts a read at 20 ms. What must it return in a linearizable history?", opts: ["1, always","0 or 1, either is allowed","0, because the write is not confirmed until 30 ms","It depends on which replica it asks"], a: 0, why: "The first read returned 1, so the write took effect no later than 15 ms. A read that starts after that read finished must therefore also see it. Going back to 0 would be moving back in time." },
    { q: "Which list orders the models from strongest to weakest?", opts: ["Linearizable, sequential, causal, eventual","Sequential, linearizable, causal, eventual","Linearizable, causal, sequential, eventual","Causal, sequential, linearizable, eventual"], a: 0, why: "Each model allows a superset of the histories of the one before it. Linearizable adds real-time ordering to sequential, sequential adds a single global order to causal, and eventual constrains only convergence." },
  ],
  explain: { prompt: "Describe a user-visible bug that causal consistency prevents but eventual consistency allows.", model: "In a comment thread, a reader sees \"Congrats!\" before the post announcing the news, or a reply before the question it answers. Causal consistency makes sure effects never appear before their causes." },
  takeaways: ["A consistency model is the set of histories a system may produce.","Linearizable, then sequential, then causal, then eventual, from strongest to weakest.","Causal is among the strongest models that can stay available."],
  cards: [
    ["Linearizability", "Each operation takes effect at one instant between its start and its confirmation. Matches real time."],
    ["Sequential consistency", "One global order respecting each client’s program order. Doesn’t have to match real time."],
    ["Causal consistency", "Causally related operations are seen in the same order by everyone. Concurrent ones may differ."],
  ],
});
