---
title: "git 基本使用"
date: 2021-04-06T18:12:57+08:00
categories: ["git"]
tags:  ["git","vision control"]
---



### 1. git 的工作区域和文件状态

+ **工作区（Working Directory）**

  也叫工作目录或者本地工作目录，对应自己电脑上的文件夹，实际操作的目录 

+ **暂存区（Staging Area/Index）**

  临时存储区域，用于保存即将提交到git仓库的修改内容

+ **本地仓库（Local Repository）**

  包含了一份完整的项目历史和元数据，是git存储代码和版本信息的主要位置

+ **工作区   >   git add   >   暂存区   >   git commit  >  本地仓库**



### 2. git diff 内容差异

+ **git diff** 

  查看工作区和缓存区的区别

+ **git diff HEAD** 

  查看工作区与本地仓库的区别

+ **git diff --cached** 

  查看暂存区和本地仓库的区别

+ **git diff  commit_id  commit_id** 

  查看提交之间的区别（head~: 最新提交前一个版本，head~2：最新提交之前的第二个版本）

+ **git diff  branch_name  branch_name**  

  查看分支之间的区别



### 3. git reset 版本回退

+ **--soft  commit_id**

  回退到 commit_id 指定的版本，并且**保存**工作区和暂存区的工作内容

+ **--hard  commit_id**

  回退到 commit_id 指定的版本，并且**丢弃**工作区和暂存区的工作内容

+ **--mixd  commit_id （ default ）**

  reset 命令的默认参数，回退到 commit_id 指定的版本，并且**保存**工作区工作内容，**丢弃**暂存区的工作内容 



### 4. git remote 关联本地仓库和远程仓库

+ **git add <远程仓库别名（默认 origin)>  <远程仓库地址>**

  关联本地仓库和远程仓库

+ **git remote - v**

  查看远程仓库地址

+ **git push -u origin main:mian**

  关联本地 main 分支与远程 main 分支，并推送到远程仓库

  + -u：upstream 的缩写
  + origin：远程仓库别名

  + mian:mian：关联本地仓库 mian 和远程仓库 mian ，如果分支名称一样可以只写一个（git push -u origin main）



### 5. git 分支基本操作

+ **新建分支**

  git branch <分支名称>

+ **切换分支**

  git checkout <分支名称>  （也可以用来恢复文件）

  git switch <分支名称> （专用，更推荐）

+ **合并分支**

  git merge <分支名称>  （指定的分支合并到当前分支）

+ **删除分支**

  git branch -d <分支名称>  （已合并分支）

  git branch -D <分支名称>  （未合并分支）



### 6. git 解决合并冲突

+ **使用 git diff 查看分支冲突的部分**

  <<<<<<<<<<< HEAD

  当前分支变化

  ==========

  合并分支的变化

  .>>>>>>>>>> dev

+ **打开文件直接修改编辑，留下想要的内容**

+ **编辑好后使用 git add . + git commit -m "" 重新提交**

+ **冲突解决完成（中断合并：git merge --abort）**



### 7. git rebase 变基与merge 的区别

1. merge branch-a 的含义就是是讲 branch-a 分支的内容合并到当前分支，也就是说：使用 merge 合并分支，需要事先切换到需要合并其他分支的分支，而rebase 命令不需要，而且在不同的分支合并会产生顺序不同的提交记录

2. 例如当前有两个分支：mian 和 dev。dev 分支是以   mian 分支的之前的某一个版本创建的，创建后 main  分支和 dev 分支都有新的提交，在两个分支执行合并另一个分支的效果如下

   {{< figure src="git_rebase.png"  title="git rebase" numbered="true" >}}

   可以见 rebase 的效果是：以目标分支为基础，将当前分支，从两个分支共同祖先（mian:3）开始的所有提交，添加到目标分支的最新提交之后，最后合并的结果是一条直线（一个分支），而 merge 则是保留了 原分支的提交记录，合并历史

3. rebase 和 merge 怎么选择

   1. merge

      优点：不会破坏原分支的提交历史，方便回溯查看

      缺点：会产生额外的提交节点，分支较多时，分支图复杂

   2. rebase

      优点：形成线性的提交历史记录，比较直观和干净

      缺点：会改变提交历史，避免在共享分支上使用

   一般规范的公司会使用 rebase 来保证提交历史的清晰，如果是比较在意历史提交以及所属分支信息可以使用 merge

4. git cherry-pick commit_id 摘取指定提交到当前分支，类似于 rebase，但是一次只能取一个提交



### 8. git flow 工作流模型

{{< figure src="git_flow.png"  title="工作流模型" numbered="true" >}}