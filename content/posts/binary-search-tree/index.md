---
title: "Binary-Search-Tree"
date: 2020-06-14T08:27:04+08:00
tags:  ["searching", "bintree"]
---

### <center>二叉查找树</center>

我们都知道在一定程度上，程序 = 算法 + 数据结构。抛开数据结构说算法；抛开算法说数据结构，都是不太妥当的。而衡量一种数据结构的优略，一是看具体的问题需求，二是看其插入，删除排序等各个方面的性能。

在二分查找中我们使用的经典的数组实现，在查询的效率上直接达到了 lgN 对数级别的效率。但是数组这种数据结构在插入元素时，就有些力不从心了。在最坏的情况下使用基于二分查找的数组插入一个元素需要N的时间成本。

而二叉查找树就是一种能将链表插入的灵活性和有序数组查找的高效性结合起来的数据结构，在平均情况下可以实现对数级别的插入和查询操作。

#### 1. 二叉查找树

定义：一棵二叉查找树（BST）是一棵二叉树，其中每个结点都含有一个键以及相关联的值，且每个结点的键都大于其左子树中的任意结点的键而小于右子树的任意结点的键。

#### 2. 实现

由于二叉查找树不是一个完全二叉树，所以难以用数组很难去表示它。这就需要写一个类来表示二叉查找树上的一个结点。每一个节点需要含有一个键，一个值，一条指向左子结点的链接，一条指向右子结点的链接和一个结点计数器。左链接指向一棵由小于该结点的所有键组成的二叉查找树，右链接指向一棵由大于该结点的所有键组成的二叉查找树。结点计数器 给出了以该结点为根的子树的结点总数。

**1.查找元素**

根据二叉查找树的定义和性质，我们可以得出以下查找某一元素的算法：

如果树是空的，则查找未命中；
如果被查找的键和根结点的键相等，查找命中；
如果未命中我们就在适当的子树中继续查找。如果被查找的键较小就选择左子树，较大则选择右子树。
如果最后没有找到该元素，则返回null；

**2.插入元素**

插入元素算法的实现逻辑和查找很相似：

如果树是空的，就返回一个含有该键值对的新结点；
如果被查找的键小于根结点的键，我们会继续在左子树中插入该键，在相等时更新结点的value值，否则在右子树中插入该键，并返回结点引用。
更新结点计数器

**3.rank排名**

rank 从1开始排序, 查找元素按键值排序的排名，根据二叉查找树的性质，算法思路如下：

如果给定的键和根结点的键相等，我们返回左子树中的结点总数 t；
如果给定的键小于根结点，我们会返回该键在左子树中的排名（递归计算）；
如果给定的键大于根结点，我们会返回 t+1（根结点）加上它在右子树中的排名（递归计算）。

二叉查找树的完整实现如下，上述 1.查找元素， 2.插入元素， 3.rank排名 分别对应方法：get(), put(), rank()。

Java
```
public class BinarySearchTree {
    private Node root;      //根节点

    /**
     * 节点静态内部类
     */
    private static class Node {
        private int key;         //节点键
        private String value;    //节点值
        private Node left, right; //指向左右子树的连接
        private int N;           //以该节点为根的子树的节点数

        Node(int key, String value, int N) {
            this.key = key;
            this.value = value;
            this.N = N;
        }
    }

    //根据键值获取节点的值，节点不存在返回NUll
    public String get(int key) {
        Node node = root;
        while (node != null){
            if      (key > node.key) node = node.right;
            else if (key < node.key) node = node.left;
            else return node.value;
        }
        return null;
    }

    //向二叉查找树插入一个节点，若节点存在则更新value
    public void put(int key, String value) {
        root = put(root, key, value);
    }
    private Node put(Node node, int key, String value) {
        if (node == null) return new Node(key, value, 1);
        if      (key > node.key) node.right = put(node.right, key, value);
        else if (key < node.key) node.left = put(node.left, key, value);
        else node.value = value;
        node.N = size(node.left) + size(node.right) + 1;
        return node;
    }

    /**
     * rank 从1开始排序, 查找元素的排名
     */
    public int rank(int key){
        return rank(root, key);
    }
    private int rank(Node node, int key){
        if (node == null) return 0;
        if      (key > node.key) return 1 + size(node.left) + rank(node.right, key);
        else if (key < node.key) return rank(node.left, key);
        else return size(node.left) + 1;
    }

    /**
     * 中序遍历打印所有节点
     */
    public void inorderPrint(){
        inorderPrint(root);
    }
    private void inorderPrint(Node node){
        if (node == null) return;
        inorderPrint(node.left);
        System.out.println(node.key);
        inorderPrint(node.right);
    }

    //查看最右侧路径上的节点值
    public void printRight(){
        Node node = root;
        while (node != null){
            System.out.println(node.value);
            node = node.right;
        }
    }

    // 获取当前树的节点数
    public int size() {
       return size(root);
    }
    private int size(Node node){
        if (node == null) return 0;
        else return node.N;
    }

}
```

其中静态内部类 Node 的一个对象代表一个二叉查找树的结点，中序遍历 inorderPrint()可以按结点键值的顺序来打印结点信息。

#### 3. 分析

**使用二叉查找树的算法的运行时间取决于树的形状，而树的形状又取决于键被插入的先后顺序。**在最好的情况下，一棵含有 N 个结点的树是完全平衡的，每条空链接和根结点的距离都为～ lgN。**在最坏的情况下，按键的顺序插入，搜索路径上可能有 N个结点。**但在一般情况下树的形状和最好情况更接近。

**二叉查找树和快速排序几乎就是“双胞胎”。**树的根结点就是快速排序中的第一个切分元素（左侧的键都比它小，右侧的键都比它大），而这对于所有的子树同样适用，这和快速排序中对子数组的递归排序完全对应。这使我们能够分析得到二叉查找树的一些性质。在由 N 个随机键构造的二叉查找树中插入操作和查找未命中平均所需的比较次数为∼ 2lnN（约 1.39lgN），在二叉查找树中查找随机键的成本比二分查找高约 39%。但是因为插入一个新键的成本是对数级别的，说明这些额外的成本是值得的。

下表是基于有序数组实现二分查找，和基于二叉查找树实现查找和插入元素效率的对比。


|算法(数据结构)|查找(最坏)|插入(最坏)|查找(平均)|插入(平均)|
|-----|-----|-----|-----|-----|
|二分查找(有序数组)	|logN	|N	|logN	|N/2|
|二叉树查找(二叉查找树)	|N	|N	|1.39logN	|1.39logN|

优缺点
1.优点：能够将链表插入的灵活性和有序数组查找的高效性结合起来，在平均情况下可实现对树中元素，在对数级别时间复杂度的插入，查找操作。

2.缺点：不稳定，二叉查找树查找的性能根据树的形态确定，而插入元素的循序又决定的其形态，若是插入元素有序那么二叉查找树就会**退化为链表。**