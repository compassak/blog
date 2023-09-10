+++
title = 'Docker 容器启动顺序'
date = 2023-09-08T14:07:52+08:00
draft = false
tags =  ["docker"]
description = ""
author = ""

+++



![docker-cloud-twitter-card-20200831215025290-2020-08-31](https://cloud.compassak.top/s/PLdEWrjYtgWejFq/preview)



### 1. 控制容器启动顺序的几种方式

1. shell 脚本

2. docker compose



### 2. 什么是 docker compose，为什么使用它？

在单个物理机器上多个有依赖关系的docker容器的启动，一般可以使用docker compose工具来处理。docker compose是dcoker官方提供的一个用于**定义**和**运行**多个容器的工具。可以通过`docker-compose.yml`来描述对容器集群的定义和编排工作，最后由docker compose帮我们完成容器的创建和启动。

在一般情况下一个 `docker-compose.yml` 文件描述的是一个包括多个容器以及服务的完整应用，docker-compose 提供控制容器启动顺序的方法，以及一套命令方便我们使用。



### 3. docker compose 如何控制容器启动顺序？

通过 depens_on 容器启动参数来控制，表示当前容器依赖于 depens_on 参数指定的容器，当前容器会等到依赖的容器启动完成后再启动。下面的例子中，koa-demo 就依赖于 portainer 容器。

```yml
version: "3.3" 
services:
  portainer:
    image: 6053537/portainer-ce
    ports: 
      - 9000:9000   
    container_name: portainer  
    volumes:
       - '/home/docker/portainer/data:/data'
  koa-demo:
    image: koa-demo:v1.3
    ports: 
      - 8000:3000  
    container_name: koa-demo
    depends_on:
        - portainer
    command: /bin/bash -c 'node /app/demos/01.js'
```

depens_on 可以指定依赖多个容器，写法如下。

```yml
depens_on: 
    - container1
    - container2
    - container3

```



### 4. 扩展（服务间依赖的处理）

docker compose 工具目前还只能控制容器的启动顺序，对于不同容器内服务间依赖目前 docker-compose 还控制不了。

这时我们可以使用  [wait-for-it.sh](https://github.com/vishnubob/wait-for-it/blob/master/wait-for-it.sh) 脚本在容器启动执行的 command 中运行，等待当前容器中服务依赖的其他服务启动。

我们可以在构建Dockerfile中使用命令将 `wait0-for-it` 脚本拷贝进容器，或者先存进一个数据卷。

现在对上面的例子进行改造例，现在下面 `koa-demo` 容器会等待 `portainer` 容器中端口为 `9000` 的服务启动后再启动。

```yaml
version: "3.3" 
services:
  portainer:
    image: 6053537/portainer-ce
    ports: 
      - 9000:9000   
    container_name: portainer  
    volumes:
       - '/home/docker/portainer/data:/data'
  koa-demo:
    image: koa-demo:v1.3
    ports: 
      - 8000:3000  
    container_name: koa-demo
    depends_on:
        - portainer
    command: /bin/bash -c '/app/wait-for-it.sh portainer:9000 -- node /app/demos/01.js'
```
