---
title: "Minimum-Spanning-Tree"
date: 2020-07-21T20:51:30+08:00
categories: ["Algorithm"]
tags:  ["graph", "weighted-graph", "minimum-spanning-tree"]
---



讨论最小生成树要基于一种叫 **加权图** 的图模型。加权图的 **加权** 的含义是为图的每一条边关联一个权值或是成本。这种图相比于无向图可以更细致的描述问题。在一幅航空图中，边表示航线，权值则可以表示距离或是费用。在一幅电路图中，边表示导线，权值则可能表示导线的长度即成本，或是信号通过这条线路所需的时间。我们可以根据这些信息设计算法计算出最合适的航线，设计一个线路规划最良好的线路。

而 **最小生成树(Minimum-Spanning-Tree)** 和解决上述一类问题有着密切的联系，图的 **生成树** 是它的一颗含有其所有顶点的无环连通子图。**最小生成树** 是所有边的权值之和最小的那颗生成树。 边的权值为了适应更多的问题有可能会是一个负数。



#### 1. 加权无向图数据类型

表示加权无向图有多种方法，可以使用前面几篇文章中无向图的方法，只需要在结点中增加一个权值属性。 但是由于加权无向图中对边的操作非常频繁，所以会做一些小改动，邻接表存放的不是结点而是一个个边（Edge）对象。根据加权无向图中边的定义，描述它需要三个属性：一个顶点，另一个顶点，权重。以及实现重写一些必要的方法。具体如下：

```java
public class Edge {
    private final int v;            // 顶点之一
    private final int w;            // 另一个顶点
    private final double weight;    // 边的权重
    public Edge(int v, int w, double weight)
    {
        this.v = v;
        this.w = w;
        this.weight = weight;
    }

    public double weight() {
        return weight;
    }

    public int either() {
        return v;
    }

    public int other(int vertex) {
        if (vertex == v) return w;
        else if (vertex == w) return v;
        else throw new RuntimeException("Inconsistent edge");
    }
    
    public String toString() {
        return String.format("%d-%d %.2f", v, w, weight);
    }

    @Override
    public boolean equals(Object obj) {
        if (this == obj) return true;
        if (!(obj instanceof Edge))
            return false;
        Edge e = (Edge)obj;
        return this.v == e.v && this.weight == e.weight && this.w == e.w;
    }
}
```

该数据结构提供了 either() 和 other() 两个方法。在已知一个顶点 v 时，用例可以使用 other(v)来得到边的另一个顶点。当两个顶点都是未知的时候，用例可以使用惯用代码 v=e.either(), w=e.other(v); 来访问一个 Edge 对象 e 的两个顶点。 重写了 equals() 方法方便边的比较，排序。



**加权无向图** 数据类型与无向图数据类型类似，不同的地方在于将邻接表元素由结点变为了边对象，具体实现如下：

```java
public class EdgeWeightedGraph {
    private final int V;                 // 顶点总数
    private int E;                       // 边的总数
    private List<ArrayList<Edge>> adj;   // 邻接表

    public EdgeWeightedGraph(int V) {
        this.V = V;
        this.E = 0;
        adj = new ArrayList<>();
        for (int v = 0; v < V; v++)
            adj.add(new ArrayList<>());
    }

    public EdgeWeightedGraph(BufferedReader reader) throws IOException {
        this(Integer.parseInt(reader.readLine()));     // 读取 V
        int E = Integer.parseInt(reader.readLine());   // 读取 E
        for (int i = 0; i < E; i ++){
            String str = reader.readLine();
            String[] edge= str.split(" ");
            int v = Integer.parseInt(edge[0]);
            int w = Integer.parseInt(edge[1]);
            double weight = Double.parseDouble(edge[2]);
            addEdge(new Edge(v, w, weight));          // 添加边
        }
    }

    public int V() {
        return V;
    }

    public int E() {
        return E;
    }

    public void addEdge(Edge e) {
        int v = e.either(), w = e.other(v);
        adj.get(v).add(e);
        adj.get(w).add(e);
        E++;
    }

    public List<Edge> adj(int v) {
        return adj.get(v);
    }

    public List<Edge> edges() {
        List<Edge> es = new ArrayList<>();
        for (int v = 0; v < V; v++)
            for (Edge e : adj.get(v))
                if (e.other(v) > v)
                    es.add(e);
        return es;
    }
}
```

EdgeWeightedGraph 与 Graph 有很多相似的地方，第二个构造函数中增加了一行代码获取边的权重。增加了一个 edges() 方法可以获取加权图所有的边。



#### 2. 原理

由于最小生成树是一棵树，树的性质最小生成树也是具备的。其中对于证明最小生成树高度相关的两条性质如下：

1. 用一条边连接树的任意两个顶点都会产生一个新环。

2. 一颗树删去任意一条边将会得到两颗独立的树。

这两条性质是证明最小生成树的另一条基本性质的基础。

##### 2.1 切分定理

图的一种切分是将图的所有顶点分为两个非空且不重叠的两个集合。横切边是一条连接两个属于不同集合的顶点的边。我们称之为切分定理的这条性质将会把加权图中的所有顶点分为两个集合、检查横跨两个集合的所有边并识别哪条边应属于图的最小生成树。

```java
切分定理： 在一幅加权图中，给定任意的切分，它的横切边中的权重最小者必然属于图的最小生成树。

证明 ： 今 e 为权重最小的横切边， T 为图的最小生成树。我们采用反证法：假设 T 不包含 e。那么如果将 e 加入 T，得到的图必然含有一条经过 e 的环，且这个环至少含有另一条横切边——设为 f， f 的权重必然大于 e（因为 e 的权重是最小的且图中所有边的权重均不同）。那么我们删掉 f 而保留 e 就可以得到一棵权重更小的生成树。这和我们的假设 T 矛盾。
```
在所有边权重不同的情况下，加权连通图的最小生成树是唯一的。

切分定理是解决最小生成树问题的所有算法的基础。 更确切的说，这些算法都是一种贪心算法的特殊情况：使用切分定理找到最小生成树的一条边，不断重复直到找到最小生成树的所有边。这些算法相互之间的不同之处在于保存切分和判定权重最小的横切边的方式，但它们都是以下性质的特殊情况。



#### 3. Prim 算法

prim 算法是一种经典的计算加权连通图最小生成树的算法。基于切分定理，它的每一步都会为一棵生长中的树添加一条边。一开始这棵树只有一个顶点，然后会向它添加 V-1 条边，每次总是将下一条连接树中的顶点与不在树中的顶点且权重最小的加入树中。

其中有一个重要的问题是怎么高效的寻找到横切边集合中权重最小的边，很显然这活还得优先队列来干最容易。所以每次横切时，将横切边集合加入到一个优先队列（按边的权重排序），直接取堆顶的元素就是权重最小边。

##### 3.1 延迟实现

在 prim 算法的延迟实现 LazyPrimMST 中，使用一个由顶点索引的布尔数组 marked[]，如果顶点 v 在树中，那么 marked[v] 的值为 true。 使用一个普通队列 mst 存储最小生成树的边。使用了一个优先队列 PriorityQueue 存储每一次横切产生的横切边集合。构造生成优先队列时需要指明排序的依据：边的权重。在构造函数中传入 lamda 表达式指定。具体实现如下。

```java
public class LazyPrimMST
{
    private boolean[] marked;       // 最小生成树的顶点
    private Queue<Edge> mst;        // 最小生成树的边
    private PriorityQueue<Edge> pq; // 横切边（包括失效的边）
    public LazyPrimMST(EdgeWeightedGraph G)
    {
        pq = new PriorityQueue<>((o1, o2) -> {
            if ((o1.weight() - o2.weight()) > 0)
                return 1;
            else if ((o1.weight() - o2.weight()) == 0)
                return 0;
            else
                return -1;
        });
        marked = new boolean[G.V()];
        mst = new ArrayDeque<>();
        // 假设G是连通的
        visit(G, 0);
        while (!pq.isEmpty()) {
            // 从pq中得到权重最小的边
            Edge e = pq.poll();
            int v = e.either(), w = e.other(v);
            // 跳过失效的边
            if (marked[v] && marked[w]) continue;
            // 将边添加到树中
            mst.add(e);
            // 将顶点（v或w）添加到树中
            if (!marked[v]) visit(G, v);
            if (!marked[w]) visit(G, w);
        }
    }
    private void visit(EdgeWeightedGraph G, int v) {
        // 标记顶点v并将所有连接v和未被标记顶点的边加入pq
        marked[v] = true;
        for (Edge e : G.adj(v))
            if (!marked[e.other(v)]) pq.add(e);
    }
    public Iterable<Edge> edges() {
        return mst;
    }
    public double weight(){
        double sum = 0;
        for (Edge e : mst){
            sum += e.weight();
        }
        return sum;
    }
}
```
运行时间

```java
命题 : Prim 算法的延时实现计算一幅含有 V 个顶点和 E 条边的连通加权无向图的最小生成树所需的空间与 E 成正比，所需的时间与 ElogE 成正比（最坏情况）。

证明 : 算法的瓶颈在于优先队列的 insert() 和 delMin() 方法中比较边的权重的次数。优先

队列中最多可能有 E 条边，这就是空间需求的上限。在最坏情况下，一次插入的成本为～ lgE，

删除最小元素的成本为～ 2lgE（请见第 2 章的命题 Q）。因为最多只能插入 E 条边，删除 E 次最小元素，时间上限显而易见。
```

##### 3.2 即时实现

3.1 中延迟实现 LazyPrimMST 使用了一条优先队列来保存所有的横切边，不足的地方就是会在优先队列中保留失效的边。想要改进 LazyPrimMST，可以尝试从优先队列中删除失效的边。 我们感兴趣的只是连接树顶点和非树顶点中权重最小的边。我们不需要在优先队列中保存所有从 w 到树顶点的边——而只需要保存其中权重最小的那条。遇到连接 w 与树权重更小的边就及时更新替换就行。

在 PrimMST 的实现中，使用了一个静态内部类 Node 代替 LazyPrimMST 中的Edge 边存储在优先队列中。Node 存储了顶点以及其到树最佳边的权值，这样优先队列存储的对象数量就从（顶点数 + 无效边数）降到了（顶点数）在大规模的问题中这可能是非常巨大的花销。

由于顶点到最小生成树的最优边是在动态变化的，所以无法使用一个队列来存储顶点连接最小生成树的边。在 PrimMST 中使用 edgeTo[v] 保存“当前情况下”顶点到树的最小权重的边，可以支持不断的更新。distTo[v] 为 edgeTo[v] 这条边的权重。

具体实现如下

```java
public class PrimMST {
    private Edge[] edgeTo;                  // 距离树最近的边
    private double[] distTo;                // distTo[w]=edgeTo[w].weight()
    private boolean[] marked;               // 如果v在树中则为true
    private PriorityQueue<Node> pq;         // 有效的横切边

    private static class Node{
        int v;          // 顶点
        Double weight;  // 连接顶点 v 和树的最佳边的权重
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

    public PrimMST(EdgeWeightedGraph g){
        edgeTo = new Edge[g.V()];
        distTo = new double[g.V()];
        marked = new boolean[g.V()];
        for (int v = 0; v < g.V(); v++)
            distTo[v] = Double.POSITIVE_INFINITY;
        pq = new PriorityQueue<>(Comparator.comparing(o -> o.weight));

        distTo[0] = 0.0;
        // 用顶点0和权重0初始化pq
        pq.add(new Node(0, 0.0));
        while (!pq.isEmpty())
            // 将最近的顶点添加到树中
            visit(g, pq.poll().v);
    }

    private void visit(EdgeWeightedGraph G, int v) {
        // 将顶点v添加到树中，更新数据
        marked[v] = true;
        for (Edge e : G.adj(v))
        {
            int w = e.other(v);
            // v-w失效
            if (marked[w]) continue;
            if (e.weight() < distTo[w]) {
                // 连接w和树的最佳边Edge变为e
                edgeTo[w] = e;
                distTo[w] = e.weight();
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

    public List<Edge> edges() {
        return new ArrayList<>(Arrays.asList(edgeTo).subList(1, edgeTo.length));
    }

    public double weight(){
        List<Edge> mst = edges();
        double sum = 1;
        for (Edge e : mst){
            sum += e.weight();
        }
        return sum-1;
    }
}
```

PrimMST 会从优先队列中取出一个顶点 v 并检查它的邻接链表中的每条边v-w。如果 w 已经被标记过，那么这条边就已经失效了；如果 w 不在优先队列中或者 v-w 的权重小于目前已知的最小值 edgeTo[w]，代码会更新数组，将 v-w 作为将 w 和树连接的最佳选择。

运行时间

```java
命题 : Prim 算法的即时实现计算一幅含有 V 个顶点和 E 条边的连通加权无向图的最小生成树所需的空间和 V 成正比，所需的时间和 ElogV 成正比（最坏情况）。

证明。因为优先队列中的顶点数最多为 V，且使用了三条由顶点索引的数组，所以所需空间的

上限和 V 成正比。算法会进行 V 次插入操作， V 次删除最小元素的操作和（在最坏情况下） E

次改变优先级的操作。已知在基于堆实现的索引优先队列中所有这些操作的增长数量级为 logV

所以将所有这些加起来可知算法所需时间和 ElogV 成正比
```



#### 4. Kruskal 算法

Kruskal 算法与 prim 算法不同的是：prim 算法以顶点为单位处理图，而Kruskal 算法则是以边为单位处理图。 

Kruskal 算法的主要思想是按照边的权重顺序（从小到大）处理它们，将边加入最小生成树中，加入的边不会与已经加入的边构成环，直到树中含有 V-1条边为止。具体实现如下。

```java
public class KruskalMST {
    private Queue<Edge> mst;

    public KruskalMST(EdgeWeightedGraph g){
        mst = new ArrayDeque<>();
        PriorityQueue<Edge> pq = new PriorityQueue<>((o1, o2) -> {
            if ((o1.weight() - o2.weight()) > 0)
                return 1;
            else if ((o1.weight() - o2.weight()) == 0)
                return 0;
            else
                return -1;
        });
        pq.addAll(g.edges());
        UF uf = new UF(g.V());

        while (!pq.isEmpty() && mst.size() < g.V()-1){
            Edge e = pq.poll();
            int v = e.either(), w = e.other(v);
            if (uf.find(v) == uf.find(w)){ continue;}
            uf.union(v, w);
            mst.add(e);
        }
    }

    public Iterable<Edge> edges(){
        return mst;
    }

    public double weight(){
        double sum = 0;
        for (Edge e : mst){
            sum += e.weight();
        }
        return sum;
    }
}
```

Kruskal 算法的实现使用了一条队列来保存最小生成树中的所有边、一条优先队列来保存还未被检查的边和一个 union-find 的数据结构来判断无效的边。最小生成树的所有边会按照权重的升序返回给用例。

运行时间

```java
命题 : Kruskal 算法的计算一幅含有 V 个顶点和 E 条边的连通加权无向图的最小生成树所需的空间和 E 成正比，所需的时间和 ElogE 成正比（最坏情况）。
　
证明: 算法的实现在构造函数中使用所有边初始化优先队列，成本最多为 E 次比较。

优先队列构造完成后，其余的部分和 Prim 算法完全相同。优先队列中最多可能含有 E 条边，

即所需空间的上限。每次操作的成本最多为 2lgE 次比较，这就是时间上限的由来。 Kruskal 算

法最多还会进行 E 次 connected() 和 V 次 union() 操作，但这些成本相比 ElogE 的总时间的增长数量级可以忽略不计。
```

Kruskal 算法执行的时间在表达式上与 延时实现的 LazyPrimMST 相等，但是Kruskal 算法一般还是比 LazyPrimMST 算法要慢一些，因为在处理每条边时除了两种算法都要完成的优先队列操作之外，它还需要进行一次 connect() 操作。



图片资料来自：

1. Algorithms (4th Edition)

2. [GeeksforGeeks](www.geeksforgeeks.org)

