---
title: "Shortest Path"
date: 2020-07-24T19:03:39+08:00
tags:  ["graph"]

# featured posts are shown on the homepage
featured: true
draft: false
---



### <center>最短路径</center>

在简单的无向图模型中，我们使用 _广度优先搜索_ 可以找到一个顶点到另一个顶点的最短路径（含顶点最少）。但是在加权图中情况有了很大的不同，需要考虑边的权重，这也更贴合许多实际问题。在加权图中的最短路径又可以理解为：找到从一个顶点到达另一个顶点的成本最小的路径。

为了能够解决更多的实际问题，方便提取问题的抽象模型。我们讨论最短路径基于的图模型一定要具有一般性，考虑更多的变量。也就是加权有向图模型，每一条路径都是有向的，而且有一个和路径关联的权重。

#### 1. 加权有向图数据结构

考虑到加权有向图于有向图有一定类似，而且边具有权重，会有很多对边的操作，需要像有向图那样将边抽象实现。有向边的数据结构比无向边简单很多，因为边只有一个方向，指定一个顶点为起点，另一个为终点就行了。加权有向边的具体实现如下：

DirectedEdge
```
public class DirectedEdge {
    private final int v;            // 边起点
    private final int w;            // 边终点
    private final double weight;    // 边权重

    public DirectedEdge(int v, int w, double weight) {
        this.v = v;
        this.w = w;
        this.weight = weight;
    }

    public double weight(){
        return weight;
    }

    public int from(){
        return v;
    }

    public int to(){
        return w;
    }

    public String toString() {
        return String.format("%d->%d %.2f", v, w, weight);
    }
}
```

加权有向图数据结构与加权无向图 EdgeWeightedGraph 类似，区别在于边具有方向后在 addEdge() 只需要在起点索引对应邻接表中添加边。以及成员属性是加权无向边还是加权有向边的区别。加权有向图具体实现如下：

EdgeWeightedDigraph
```
public class EdgeWeightedDigraph {
    private final int V;                         // 顶点总数
    private int E;                               // 边的总数
    private List<ArrayList<DirectedEdge>> adj;   // 邻接表

    public EdgeWeightedDigraph(int V) {
        this.V = V;
        this.E = 0;
        adj =  new ArrayList<>();
        for (int v = 0; v < V; v++)
            adj.add(new ArrayList<>());
    }

    public EdgeWeightedDigraph(BufferedReader reader) throws IOException {
        this(Integer.parseInt(reader.readLine()));     // 读取 V
        int E = Integer.parseInt(reader.readLine());   // 读取 E
        for (int i = 0; i < E; i ++){
            String str = reader.readLine();
            String[] edge= str.split(" ");
            int v = Integer.parseInt(edge[0]);
            int w = Integer.parseInt(edge[1]);
            double weight = Double.parseDouble(edge[2]);
            addEdge(new DirectedEdge(v, w, weight));          // 添加边
        }
    }

    /**
     * 在有向边起点对应的邻接表添加一条边
     * @param e 有向边
     */
    public void addEdge(DirectedEdge e)
    {
        adj.get(e.from()).add(e);
        E++;
    }

    /**
     * 查询所有从顶点出的边。
     * @param v 顶点
     * @return 所有从顶点出的边
     */
    public List<DirectedEdge> adj(int v){
        return adj.get(v);
    }

    public List<DirectedEdge> edges(){
        List<DirectedEdge> edges = new ArrayList<>();
        for (List<DirectedEdge> es : adj){
            edges.addAll(es);
        }
        return edges;
    }

    public int V() { return V; }
    public int E() { return E; }
}
```

#### 2. 最短路径的性质

定义：在一幅加权有向图中，从顶点 s 到顶点 t 的最短路径是所有从 s 到 t 的路径中的权重最小者。

基于上述的加权有向图数据结构的最短路径具有下列值得注意的几个点：

1. 路径是有向的。

2. 权重不一定等价于距离。

3. 指定起点后，不一定所有顶点都可达。

4. 边的权重可以为负值。

5. 最短路径不一定是唯一的。

6. 最短路径一般都是简单的。

7. 可能存在平行边和自环。

#### 3. 最短路径算法理论基础

在计算加权有向图的多数常用算法都是基于 松弛（relaxation）的简单操作。松弛分为边的松弛，顶点的松弛。

**3.1 最短路径的数据结构**

根据我们对问题的定义，我们需要求出给定起点的加权有向图到所有可达顶点的最短路径。其计算结果是是一棵 _最短路径树_ （给定一幅加权有向图和一个顶点 s，以 s 为起点的一棵最短路径树是图的一幅子图，它包含 s和从 s 可达的所有顶点。这棵有向树的根结点为 s，树的每条路径都是有向图中的一条最短路径）

一般来说，从 s 到一个顶点有可能存在两条长度相等的路径。如果出现这种情况，可以删除其中一条路径的最后一条边。如此这般，直到从起点到每个顶点都只有一条路径相连（即一棵树）。

记录表示最短路径所需的数据结构很简单，和以前深度优先搜索，广度优先搜索保存路径类似：使用一个由顶点索引的 DirectedEdge 对象的父链接数组 edgeTo[]，其中 edgeTo[v]的值为树中连接 v 和它的父结点的边（也是从s到v的最短路径上的最后一条边）。

最后为了权重的比较和计算需要一个由顶点索引的数组 distTo[]，其中 distTo[v] 为从 s 到 v 的已知最短路径的长度。我们约定， edgeTo[s] 的值为 null， distTo[s] 的值为 0，从起点到不可达的顶点的距离均为 Double.POSITIVE_INFINITY。

**3.2 边的松弛**

边的放松操作是一项非常容易实现的重要操作，它是实现最短路径算法的基础。

定义： 放松边 v → w 意味着检查从 s 到 w 的最短路径是否是先从 s 到 v，然后再由 v 到 w。如果是，进行下一步。经由 v 到达 w 的最短路径是 distTo[v] 与 e.weight() 之和，如果这个值不小于 distTo[w]，则称这条边失效了并将它忽略；如果这个值更小，就更新 distTo[w] 数据。一般实现如下：

```
private void relax(DirectedEdge e){
    int v = e.from(), w = e.to();
    if (distTo[w] > distTo[v] + e.weight()){
        distTo[w] = distTo[v] + e.weight();
        edgeTo[w] = e;
    }
}
```
松弛这个术语来自于用一根橡皮筋沿着连接两个顶点的路径紧紧展开的比喻：放松一条边就类似于将橡皮筋转移到一条更短的路径上，从而缓解了橡皮筋的压力。如果 relax() 改变了和边 e 相关的顶点的 distTo[e.to()] 和 edgeTo[e.to()] 的值，就称 e 的放松是成功的。

**3.3 顶点的松弛**

实际上为了方便操作，实现会放松从一个给定顶点指出的所有边。也就是顶点的松弛，一般实现如下：

```
private void relax(EdgeWeightedDigraph G, int v) {
        for (DirectedEdge e : G.adj(v)){
            int w = e.to();
            if (distTo[w] > distTo[v] + e.weight()) {
                distTo[w] = distTo[v] + e.weight();
                edgeTo[w] = e;
            }
        }
    }
```

**3.4 最优性条件**

```java
命题 P（最短路径的最优性条件） 。令 G 为 一 幅 加 权 有 向 图， 顶 点 s 是 G 中 的 起 点，
distTo[] 是一个由顶点索引的数组，保存的是 G 中路径的长度。对于从 s 可达的所有顶点 v，
distTo[v] 的值是从 s 到 v 的某条路径的长度，对于从 s 不可达的所有顶点 v，该值为无穷大。
当且仅当对于从 v 到 w 的任意一条边 e，这些值都满足 distTo[w]<=distTo[v]+e.weight()
时（换句话说，不存在有效边时），它们是最短路径的长度。

证明。假设 distTo[w] 是从 s 到 w 的最短路径。如果对于某条从 v 到 w 的边 e 有 distTo[w]>
distTo[v]+e.weight()， 那 么 从 s 到 w（ 经 过 v） 且 经 过 e 的 路 径 的 长 度 必 然 小 于
distTo[w]，矛盾。因此最优性条件是必要的。
要证明最优性条件是充分的，假设 w 是从 s 可达的且 s=v0 → v1 → v2... → vk=w 是从 s 到 w 的
最短路径，其权重为 OPTsw。对于 1 到 k 之间的 i，令 ei 表示 vi-1 到 vi 的边。根据最优性条件，
可以得到以下不等式：
    distTo[w] = distTo[vk] <= distTo[vk-1] + ek.weight()
    distTo[vk-1] <= distTo[vk-2] + ek-1.weight()
    ...
    distTo[v2] <= distTo[v1] + e2.weight()
    distTo[v1] <= distTo[s] + e1.weight()
综合这些不等式并去掉 distTo[s]=0.0，得到：
distTo[w] <= e1.weight() + ... + ek.weight() = OPTSW.
现在， distTo[w] 为从 s 到 w 的某条边的长度，因此它不可能比最短路径更短。所以我们有以
下不等式：
OPTSW <= distTo[w] <= OPTSW
且等号必然成立
```

#### 4. Dijkstra 算法

Dijkstra 算法采用了于 Prim 算法类似的方法来计算最短路径树。首先将 distTo[s]初始化为 0， distTo[] 中的其他元素初始化为正无穷。然后将 distTo[] 最小的非树顶点放松并加入树中，如此这般，直到所有的顶点都在树中或者所有的非树顶点的 distTo[] 值均为无穷大。

要实现 Dijkstra 算法，除了 distTo[] 和 edgeTo[] 数组之外还需要一条索引优先队列 pq，以保存需要被放松的顶点并确认下一个被放松的顶点。使用与 prim 算法类似的结点作为优先队列的元素。两种之间的原理区别是： Prim 算法每次添加的都是离树最近的非树顶点， Dijkstra算法每次添加的都是离起点最近的非树顶点。

DijkstraSP 的实现如下：

```
public class DijkstraSP {
    private DirectedEdge[] edgeTo;
    private double[] distTo;
    private PriorityQueue<Node> pq;

    private static class Node{
        int v;          // 顶点
        Double weight;  // 连接顶点 v 和起点的最佳边的权重
        Node(int v, Double weight){
            this.v = v; this.weight = weight;
        }

        @Override
        public boolean equals(Object obj){
            if (this == obj) return true;
            if (!(obj instanceof Node))
                return false;
            Node node = (Node)obj;
            return this.v == node.v && this.weight.equals(node.weight);
        }
    }

    public DijkstraSP(EdgeWeightedDigraph g, int s){
        edgeTo = new DirectedEdge[g.V()];
        distTo = new double[g.V()];
        pq = new PriorityQueue<>(Comparator.comparing(o -> o.weight));

        for (int v = 0; v < g.V(); v++) {
            distTo[v] = Double.POSITIVE_INFINITY;
        }

        distTo[s] = 0.0;
        pq.add(new Node(s, 0.0));
        while (!pq.isEmpty())
            relax(g, pq.poll().v);
    }

    /**
     * 顶点放松函数，寻找顶点到起点的最短（权重）路径
     * @param g 加权有向图
     * @param v 当前顶点
     */
    private void relax(EdgeWeightedDigraph g, int v){
        for (DirectedEdge e : g.adj(v)){
            int w = e.to();
            if (distTo[w] > distTo[v] + e.weight()){
                distTo[w] = distTo[v] + e.weight();
                edgeTo[w] = e;
                Node node =  new Node(w, distTo[w]);
                for (Object obj : pq.toArray()) {
                    if (((Node) obj).v == node.v) {
                        pq.remove(obj);
                        break;
                    }
                }
                pq.add(node);
            }
        }
    }

    /**
     * 起点到 v 最小权重路径的权重
     * @param v 当前顶点
     * @return 权重
     */
    public double distTo(int v) {
        return distTo[v];
    }

    public boolean hasPathTo(int v) {
        return distTo[v] < Double.POSITIVE_INFINITY;
    }

    /**
     * 获取起点到 v 最小权重路径边的集合
     * @param v 当前顶点
     * @return 最小权重路径边的集合
     */
    public List<DirectedEdge> pathTo(int v)
    {
        if (!hasPathTo(v)) return null;
        List<DirectedEdge> path = new ArrayList<>();
        for (DirectedEdge x = edgeTo[v]; x != null ; x = edgeTo[x.from()]) {
            path.add(x);
        }
        Collections.reverse(path);
        return path;
    }
}
```
Dijkstra 算法的实现使用顶点松弛的方法每次都会为最短路径树添加一条边，该边由一个树中的顶点指向一个非树顶点 w 且它是到 s 最近的顶点。

#### 5. 无环加权有向图中的最短路径算法

许多应用中的加权有向图都是不含有有向环的，解决这些特殊的问题我们可以改良出更好更快的算法，能够处理负权重的边，能够在线性时间内解决单点最短路径问题。

算法主要步骤是将顶点的放松和拓扑排序结合起来，得到一种解决无环加权有向图中的最短路径问题的算法：首先，将 distTo[s] 初始化为 0，其他 distTo[] 元素初始化为无穷大，然后一个一个地按照拓扑顺序放松所有顶点。

正确性证明：

```
命题 S。按照拓扑顺序放松顶点，就能在和 E+V 成正比的时间内解决无环加权有向图的单点最
短路径问题。

证明。每条边 v → w 都只会被放松一次。当 v 被放松时，得到： distTo[w]<= distTo[v]+e.
weight()。在算法结束前该不等式都成立，因为 distTo[v] 是不会变化的（因为是按照拓扑
顺序放松顶点，在 v 被放松之后算法不会再处理任何指向 v 的边）而 distTo[w] 只会变小（任
何放松操作都只会减小 distTo[] 中的元素的值）。因此，在所有从 s 可达的顶点都被加入到
树中后，最短路径的最优性条件成立，命题 Q 也就成立了。时间上限很容易得到：命题 G 告诉
我们拓扑排序所需的时间与 E+V 成正比，而在第二次遍历中每条边都只会被放松一次，因此算
法总耗时与 E+V 成正比。
```

根据上述算法原理实现的 AcyclicSP 如下。该实现中不需要布尔数组 marked[]：因为是按照拓扑顺序处理无环有向图中的顶点，所以不可能再次遇到已经被放松过的顶点。在拓扑排序后，构造函数会扫描整幅图并将每条边放松一次。在已知加权图是无环的情况下，它是找出最短路径的最好方法。

```
public class AcyclicSP {
    private DirectedEdge[] edgeTo;
    private double[] distTo;

    public AcyclicSP(EdgeWeightedDigraph g, int s){
        edgeTo = new DirectedEdge[g.V()];
        distTo = new double[g.V()];
        for (int v = 0; v < g.V(); v++)
            distTo[v] = Double.POSITIVE_INFINITY;
        distTo[s] = 0.0;

        DepthFirstOrder order = new DepthFirstOrder(g);
        // 按照顶点拓扑排序遍历图
        for (int v : order.reversePost()){
            relax(g, v);
        }
    }

    /**
     * 顶点放松函数，寻找顶点到起点的最短（权重）路径
     * @param g 加权有向图
     * @param v 当前顶点
     */
    private void relax(EdgeWeightedDigraph g, int v){
        for (DirectedEdge e : g.adj(v)){
            int w = e.to();
            if (distTo[w] > distTo[v] + e.weight()){
                distTo[w] = distTo[v] + e.weight();
                edgeTo[w] = e;
            }
        }
    }

    /**
     * 起点到 v 最小权重路径的权重
     * @param v 当前顶点
     * @return 权重
     */
    public double distTo(int v) {
        return distTo[v];
    }

    public boolean hasPathTo(int v) {
        return distTo[v] < Double.POSITIVE_INFINITY;
    }

    /**
     * 获取起点到 v 最小权重路径边的集合
     * @param v 当前顶点
     * @return 最小权重路径边的集合
     */
    public List<DirectedEdge> pathTo(int v)
    {
        if (!hasPathTo(v)) return null;
        List<DirectedEdge> path = new ArrayList<>();
        for (DirectedEdge x = edgeTo[v]; x != null ; x = edgeTo[x.from()]) {
            path.add(x);
        }
        Collections.reverse(path);
        return path;
    }
}
```

对于最短路径问题，由于图的“无环”能够极大地简化问题的论断,基于拓扑排序的方法比 Dijkstra 算法快的倍数与 Dijkstra 算法中所有优先队列操作的总成本成正比。

**5.1 最长路径**

无环加权有向图中的单点最长路径 : 给定一幅无环加权有向图（边的权重可能为负）和一个起点 s，是否存在一条从 s到给定的顶点 v的路径使得顶点 s 到 v 的权重最大。

使用 AcyclicSP 的解决思路是：复制原始无环加权有向图得到一个副本并将副本中的所有边的权重取相反数。这样，副本中的最短路径即为原图中的最长路径。要将最短路径问题的答案转换为最长路径问题的答案，只需将方案中的权重变为正值即可。根据命题 S 立即可以得到算法所需的时间。

和它形成鲜明对比的是，在一般的加权有向图（边的权重可能为负）中寻找最长简单路径的已知最好算法在最坏情况下所需的时间是指数级别的。出现环的可能性似乎使这个问题的难度以指数级别增长。

**5.2 并行任务调度**

优先级限制下的并行任务调度：给定一组需要完成的任务和每个任务所需的时间，以及一组关于任务完成的先后次序的优先级限制。在满足限制条件的前提下应该如何在若干相同的处理器上（数量不限） 安排任务并在最短的时间内完成所有任务。

在有向图的模型默认只有单个处理器：将任务按照拓扑顺序排序，完成任务的总耗时就是所有任务所需要的总时间。现在假设有足够多的处理器并能够同时处理任意多的任务，受到的只有优先级的限制。令人兴奋的是，正好存在一种线性时间的算法——一种叫做“关键路径“的方法能够证明这个问题与无环加权有向图中的最长路径问题是等价的。

假设任意可用的处理器都能在任务所需的时间内完成它，那么我们的重点就是尽早安排每一个任务。由优先级限制指定的每一列任务都代表了调度方案的一种可能的时间下限。如果将一系列任务的长度定义为完成所有任务的最早可能时间，那么最长的任务序列就是问题的 _关键路径_ ，因为在这份任务序列中任何任务的启动延迟都会影响到整个项目的完成时间。

解决并行任务调度问题的关键路径方法的步骤如下：创建一幅无环加权有向图，其中包含一个起点 s 和一个终点 t 且每个任务都对应着两个顶点（一个起始顶点和一个结束顶点）。对于每个任务都有一条从它的起始顶点指向结束顶点的边，边的权重为任务所需的时间。对于每条优先级限制 v → w，添加一条从 v 的结束顶点指向 w 的起始顶点的权重为零的边。我们还需要为每个任务添加一条从起点指向该任务的起始顶点的权重为零的边以及一条从该任务的结束顶点到终点的权重为零的边。这样，每个任务预计的开始时间即为从起点到它的起始顶点的最长距离。

#### 6.  一般加权有向图中的最短路径问题

AcyclicSP 实现的算法虽然非常快达到了线性级别，但是它要求图是无环的。以至于它无法处理一部分有环的加权有向图的问题。我们需要找到一种既可能含有环也可能含有负权重的边的加权有向图中的最短路径算法。

由于具有父权重的边，以及负权重的环。我们需要更新一下对最短路径的认知，当存在负权重的边时，权重较小的路径含有的边可能会比权重较大的路径更多。在只存在正权重的边时，我们的重点在于寻找近路；但当存在负权重的边时，我们可能会为了经过负权重的边而绕弯。这种效应使得我们要将查找“最短”路径的感觉转变为对算法本质的理解。

**6.1 负权重环的检测**

负权重环的检测是算法设计需要解决的一个重要问题，按照以往的算法流程走，算法会在负权重环中陷入无限循环。如何避免这种情况是算法实现的关键。一般使用以下策略检测负权重环：

1. 添加一个变量 cycle 和一个私有函数 findNegativeCycle()。如果找到负权重环，该方法会将cycle 的值设为含有环中所有边的一个集合（如果没有找到则设为 null）。

2. 每调用 V 次 relax() 方法后即调用 findNegativeCycle() 方法。

这种方法能够保证构造函数中的循环必然会终止。另外，用例可以调用 hasNegativeCycle()来判断是否存在从起点可达的负权重环（并用 negativeCycle() 来获取这个环）

具体的 findNegativeCycle() 实现原理是：首先，算法会使用一个加权有向边数组 DirectedEdge[] edgeTo 来存储起点到各顶点的最短路径（权重最小），如果算法访问到了一个负权重环，那么它一定会出现在 edgeTo 中（正权重环就不会，因为绕环一圈权重不会减小，也就根本不可能会绕）。这时我们就可以使用一般的环检测方法来检测它，只需要扩展深度优先搜索中的 DirectedCycle 就可以完成。具体实现如下：

```
private void findNegativeCycle(){
        EdgeWeightedDigraph spt = new EdgeWeightedDigraph(edgeTo.length);
        for (DirectedEdge e : edgeTo)
            if (e != null)
                spt.addEdge(e);
        EdgeWeightedCycleFinder cf = new EdgeWeightedCycleFinder(spt);
        cycle = cf.cycle();
    }
```

EdgeWeightedCycleFinder 由 DirectedCycle 扩展而来。

**6.2 Bellman-Ford 算法实现**

完成了最重要的负权重环检测，一般加权有向图中的最短路径算法 Bellman-Ford 的其它地方和上述最短路径算法类似。不同的地方主要有以下两点：

1. 一条用来保存即将被放松的顶点的队列 queue；

2. 一个由顶点索引的 boolean 数组 onQ[]，用来指示顶点是否已经存在于队列中，以防止将顶点重复插入队列。

BellmanFordSP 的具体实现如下。

```
public class BellmanFordSP {
    private double[] distTo;                // 从起点到某个顶点的路径长度
    private DirectedEdge[] edgeTo;          // 从起点到某个顶点的最后一条边
    private boolean[] onQ;                  // 该顶点是否存在于队列中
    private Queue<Integer> queue;           // 正在被放松的顶点
    private int cost;                       // relax()的调用次数
    private List<DirectedEdge> cycle;       // edgeTo[]中的是否有负权重环

    public BellmanFordSP(EdgeWeightedDigraph G, int s) {
        distTo = new double[G.V()];
        edgeTo = new DirectedEdge[G.V()];
        onQ = new boolean[G.V()];
        queue = new ArrayDeque<>();
        for (int v = 0; v < G.V(); v++)
            distTo[v] = Double.POSITIVE_INFINITY;
        distTo[s] = 0.0;
        queue.add(s);
        onQ[s] = true;
        while (!queue.isEmpty() && !hasNegativeCycle())
        {
            int v = queue.poll();
            onQ[v] = false;
            relax(G, v);
        }
    }

    private void relax(EdgeWeightedDigraph G, int v) {
        for (DirectedEdge e : G.adj(v)){
            int w = e.to();
            if (distTo[w] > distTo[v] + e.weight()) {
                distTo[w] = distTo[v] + e.weight();
                edgeTo[w] = e;
                if (!onQ[w])
                {
                    queue.add(w);
                    onQ[w] = true;
                }
            }
            if (cost++ % G.V() == 0)
                findNegativeCycle();
        }
    }

    private void findNegativeCycle()    // 如6.1所示

    public boolean hasNegativeCycle(){
        return cycle != null;
    }

    public Iterable<DirectedEdge> negativeCycle(){
        return cycle;
    }
}
```

Bellman-Ford 算法的实现修改了 relax() 方法，将被成功放松的边指向的所有顶点加入到一条FIFO 队列中（队列中不出现重复的顶点）并周期性地检查 edgeTo[]表示的子图中是否存在负权重环（cost++ % G.V() == 0）

#### 7. 几种最短路径算法的比较


|算　法| 局　限|路径长度的比较次数（一般）|路径长度的比较次数（最坏）|所需空间| 优　　势|
|-------|-------|-------|-------|-------|-------|
|Dijkstra 算法（即时版本）| 边的权重必须为正| ElogV| ElogV| V |最坏情况下仍有较好的性能|
|拓扑排序法 | 只适用于无环加权有向图| E+V| E+V| V| 是无环图中的最优算法|
|Bellman-Ford算法（基于队列）| 不能存在负权重环| E+V| VE| V| 适用领域广泛|