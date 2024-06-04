---
title: "Merge-Sort"
date: 2020-05-17T08:27:04+08:00
tags:  ["sorting", "divide-and-conquer"]
---



顾名思义，并归排序是排序算法的一种，它的主要特点及思想就是体现在 “并归” 二字。并归排序中的并归的含义是指，将两个有序的数组并归组合成一个更大的有序数组。

**而并归排序的思想就是将一个待排序数组（递归的）平均分割成两个子数组，然后分别给左右两个子数组排序，最后将排序结果并归起来，完成数组的排序。**

#### 1. 自顶向下的并归排序

自顶向下的并归排序也被称为递归并归排序。递归实现的归并排序是算法设计中分治思想的典型应用。我们将一个大问题分割成小问题分别解决，然后用所有小问题的答案来解决整个大问题： 将一个待排序数组（递归的）平均分割成两个子数组，两个子数组又递归的调用排序方法，直到递归到子数组只含一个元素。然后将二者并归就得到了一个含两个元素的有序数组。最后依次回溯并归直到待排序数组中没有子数组，完成排序。

```java
public class Merge {
    //并归所需的辅助数组
    private static int[] aux;

    /**
     * sort1 自顶向下的并归排序
     * @param a 待排序数组
     */
    public static void sort1(int[] a) {
        //分配空间
        aux = new int[a.length];
        sort1(a, 0, a.length-1);
    }

    private static void sort1(int[] a, int lo, int hi) {
        //数组长度为1
        if (hi <= lo) return;
        int mid = lo + (hi - lo) / 2;
        //排序左半边
        sort1(a, lo, mid);
        //排序右半边
        sort1(a, mid + 1, hi);
        //并归结果
        merge(a, lo, mid, hi);
    }

    /**
     * sort2 自底向上的并归排序
     * @param a 待排序数组
     */
    public static void sort2(int[] a){
        int n = a.length;
        aux = new int[n];
        for (int sz = 1; sz < n; sz = sz+sz){
            for (int lo = 0; lo < n-sz; lo += sz+sz ){
                merge(a, lo, lo+sz-1, Math.min(lo+sz+sz-1, n-1));
            }
        }
    }

    //并归操作
    private static void merge(int[] a, int lo, int mid, int hi) {
        int i = lo, j = mid + 1;
        //复制数组(a[lo...hi] -> aux[lo...hi])
        for (int k = lo; k <= hi; k++)
            aux[k] = a[k];
        //并归元素到 a[lo...hi] 中
        for (int k = lo; k <= hi; k++) {
            //左半边元素用尽
            if (i > mid)
                a[k] = aux[j++];
            //右半边元素用尽
            else if (j > hi)
                a[k] = aux[i++];
            //右半边当前元素大于左半边当前元素
            else if (aux[j] > aux[i])
                a[k] = aux[i++];
            else
                a[k] = aux[j++];
        }
    }
}
```

#### 2. 自底向上的并归排序

实现归并排序的另一种方法是先归并那些微型数组，然后再成对归并得到的子数组，如此这般，直到我们将整个数组归并在一起。这种实现方法比标准递归方法所需要的代码量更少。自底向上的归并排序会多次遍历整个数组，根据子数组大小进行两两归并。子数组的大小 sz 的初始值 为1，每次加倍。

Java

```java
public class Merge {
    //并归所需的辅助数组
    private static int[] aux;

    //sort2 自底向上的并归排序
    private static void sort(int[] a){
        int n = a.length;
        aux = new int[n];
        for (int sz = 1; sz < n; sz = sz+sz){
            for (int lo = 0; lo < n-sz; lo += sz+sz ){
                merge(a, lo, lo+sz-1, Math.min(lo+sz+sz-1, n-1));
            }
        }
    }

    //并归操作
    private static void merge(int[] a, int lo, int mid, int hi) {
        int i = lo, j = mid + 1;
        //复制数组(a[lo...hi] -> aux[lo...hi])
        for (int k = lo; k <= hi; k++)
            aux[k] = a[k];
        //并归元素到 a[lo...hi] 中
        for (int k = lo; k <= hi; k++) {
            //左半边元素用尽
            if (i > mid)
                a[k] = aux[j++];
            //右半边元素用尽
            else if (j > hi)
                a[k] = aux[i++];
            //右半边当前元素大于左半边当前元素
            else if (aux[j] > aux[i])
                a[k] = aux[i++];
            else
                a[k] = aux[j++];
        }
    }
}
```

#### 3. 复杂度分析

并归排序时间复杂度的推导公式为：**T(n) = 2T(2/n) + n , 并设：T(0)=T(1)=0** ，其中 **T(2/n)** 为平分后两个子数组排序的时间复杂度，**n**为并归数组所需的时间

1. 在初次递归的基础上进行第二次递归：**T(n) = 2{2T(n/4) + (n/2)} + n = 2^2T(n/2^2) + 2n**

2. 第三次递归：**T(n) = 2^2{2T(n/2^3) + n/(2^2)} + 2n = 2^3 T(n/2^3) + 3n**

**……**

假设递归到 **m** 次时，递归完成，则有：**T(n) = 2^m T(n/2^m) + mn = 2^m T(1) + mn**

得到：**T(n/2^m) = T(1) —> n = 2^m —> m = logn (默认以2为底)**

将 **m = logn** 代入 **2^m T(1) + mn：T(n) = 2^(logn) T(1) + nlogn = n T(1) + nlogn = n + nlogn**

当n足够大时 **nlogn** 远大于 **n** 所以取：**nlogn**

综上并归排序的时间复杂度为：**O( nlogn )**

由于使用了一个辅助数组所以空间复杂度为：**O( n )**


#### 4. 优缺点

**优点**

1. 时间复杂度为 O( nlogn ), 是基于比较的排序算法能达到的最好情况。

2. 算法稳定，分别在最好情况以及最坏情况的时间复杂度都是 O( nlogn )。多用于对象的排序。

**缺点**

1. 需要辅助数组，空间复杂度为O(n),在同类效率类似的算法中归并排序的空间复杂度略高。