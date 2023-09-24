---
title: 'Java socket 通信流对象的选择'
date: 2022-12-08T14:07:52+08:00
draft: false
tags:  ["Java", "socket", "Java IO"]
ShowToc: true
description: ""
author: ""
---

![1f7c8ff36c1442a2bcdc63804b4369dd](https://cloud.compassak.top/s/i8N6fMY2ckZtTKr/preview)



### 确定大致范围

查看 Java Socket 对象的方法我们可以发现，获取操控socket输入输出的对象的方法就两个：

```java
    socket.getInputStream();
    socket.getOutputStream();
```

所以我们直接使用 Java 可以由 InputStream 和 OutputStream 直接构造出来的流对象，这时我们可以将范围缩小到下面几个：

1. **BufferedInputStream / BufferedOutputStream**
2. **DataInputStream / DataOutputStream**
3. **InputStreamReader / OutputStreamWriter**
4. **ObjectInputStream / ObjectOutputStream**

四种类型的流对象都有各自的优势和缺点，下面进行简要分析



### 1. BufferedInputStream / BufferedOutputStream

读

```java
    serverSocket = new ServerSocket(port);
    Socket socket = serverSocket.accept();
    BufferedInputStream ois = new BufferedInputStream(socket.getInputStream());
    StringBuilder resMsg = new StringBuilder();
    int r = 0;
    while ((r = ois.read()) != -1) {
        resMsg.append((char) r);
    }
    String message = resMsg.toString();
```

写

```java
    Socket socket = new Socket("localhost", port);
    OutputStream os = socket.getOutputStream();
    BufferedOutputStream oos = new BufferedOutputStream(os);
    bos.write(data.getBytes());
    bos.flush();
    // bis.read() = -1
	bos.close();	
    // socket.shutdownOutput();
```

BufferedInputStream / BufferedOutputStream 最大的优点就是给输入输出的数据添加了缓存，从而减少 IO 次数来提高传输效率。而且由于需要将 socket 的 **OutPut** 关闭才能使得读取数据方，读到-1从而结束读取，而且后续 **OutPut** 是不能被重新打开 。所以在一次 socket 连接内使用 BufferedInputStream / BufferedOutputStream 只能完成两次通信（收，发）。所以使用 BufferedInputStream / BufferedOutputStream 进行 socket 通信有以下特点：

1. 有缓存，传输效率高
2. 写完需要关闭发送方的输出流对象
3. 只能在一个 socket 连接内进行一次读和一次写，两次通信

根据上述的 3 个特点，不难看出 BufferedInputStream / BufferedOutputStream 适合比较大的数据传输，且无法在一个 socket 内进行大于2次的通信，它比较适合用来**传输文件** 。



### 2. DataInputStream / DataOutputStream

DataInputStream / DataOutputStream 添加了许多支持 Java 标准类型的写入和读取的方法，其中传输字符串最有用的就是 readUTF() 方法，从函数名称我们可以看出它支持 utf-8 编码的字符串数据的传输。我们可以帮我们节省从 byte[] 到 String 的 encode 和 decode  步骤。它的读写示例如下：

读

```java
    serverSocket = new ServerSocket(port);
    Socket socket = serverSocket.accept();
    DataInputStream dis = new DataInputStream(socket.getInputStream());
    String message = dis.readUTF();
```

写

```java
    Socket socket = new Socket("localhost", port);
    OutputStream os = socket.getOutputStream();
    BufferedOutputStream oos = new BufferedOutputStream(os);
    bos.writeUTF(message));
```

与 BufferedInputStream / BufferedOutputStream 的读写代码对比来看，DataInputStream 的 readUTF 方法好像优点过于的简洁了，特别是**它怎么知道发送方已经把数据发送完了，可以结束接收了呢？** 这里就是一个很容易出错的地方，当我们继续增加一次发送数据的大小时，会产生 **UTFDataFormatException** 的异常：

```java
    java.io.UTFDataFormatException: encoded string too long: 295537 bytes
        at java.io.DataOutputStream.writeUTF(DataOutputStream.java:364)
        at java.io.DataOutputStream.writeUTF(DataOutputStream.java:323)
```

报错提示我们发送的数据太长，那么 writeUTF / readUTF 发送的限制是多大呢？点开源码就能看到如下代码：

```java
    /**
     * Writes a string to the specified DataOutput using
     * <a href="DataInput.html#modified-utf-8">modified UTF-8</a>
     * encoding in a machine-independent manner.
     * <p>
     * First, two bytes are written to out as if by the <code>writeShort</code>
     * method giving the number of bytes to follow. This value is the number of
     * bytes actually written out, not the length of the string. Following the
     * length, each character of the string is output, in sequence, using the
     * modified UTF-8 encoding for the character. If no exception is thrown, the
     * counter <code>written</code> is incremented by the total number of
     * bytes written to the output stream. This will be at least two
     * plus the length of <code>str</code>, and at most two plus
     * thrice the length of <code>str</code>.
     *
     * @param      str   a string to be written.
     * @param      out   destination to write to
     * @return     The number of bytes written out.
     * @exception  IOException  if an I/O error occurs.
     */
    static int writeUTF(String str, DataOutput out) throws IOException {
        int strlen = str.length();
        int utflen = 0;
        int c, count = 0;

        /* use charAt instead of copying String to char array */
        for (int i = 0; i < strlen; i++) {
            c = str.charAt(i);
            if ((c >= 0x0001) && (c <= 0x007F)) {
                utflen++;
            } else if (c > 0x07FF) {
                utflen += 3;
            } else {
                utflen += 2;
            }
        }

        if (utflen > 65535)
            throw new UTFDataFormatException(
                "encoded string too long: " + utflen + " bytes");

        byte[] bytearr = null;
        if (out instanceof DataOutputStream) {
            DataOutputStream dos = (DataOutputStream)out;
            if(dos.bytearr == null || (dos.bytearr.length < (utflen+2)))
                dos.bytearr = new byte[(utflen*2) + 2];
            bytearr = dos.bytearr;
        } else {
            bytearr = new byte[utflen+2];
        }

        bytearr[count++] = (byte) ((utflen >>> 8) & 0xFF);
        bytearr[count++] = (byte) ((utflen >>> 0) & 0xFF);

        int i=0;
        for (i=0; i<strlen; i++) {
           c = str.charAt(i);
           if (!((c >= 0x0001) && (c <= 0x007F))) break;
           bytearr[count++] = (byte) c;
        }

        for (;i < strlen; i++){
            c = str.charAt(i);
            if ((c >= 0x0001) && (c <= 0x007F)) {
                bytearr[count++] = (byte) c;

            } else if (c > 0x07FF) {
                bytearr[count++] = (byte) (0xE0 | ((c >> 12) & 0x0F));
                bytearr[count++] = (byte) (0x80 | ((c >>  6) & 0x3F));
                bytearr[count++] = (byte) (0x80 | ((c >>  0) & 0x3F));
            } else {
                bytearr[count++] = (byte) (0xC0 | ((c >>  6) & 0x1F));
                bytearr[count++] = (byte) (0x80 | ((c >>  0) & 0x3F));
            }
        }
        out.write(bytearr, 0, utflen+2);
        return utflen + 2;
    }
```

我们可以一眼就发现数据发送的限制是 65535 byte 也就是64k，然后通过注释和后续代码得知，**原来这个方法是把发送字符串长度写入发送数据的头两个字节的空间，16位表示无符号整数的范围就刚好是 0 ~ 65535，这就是大小限制的由来**，这也回答了上面的疑问，接收方如何知道数据已经结束完毕。

想要避免这个限制的问题，可以使用较为原始的传输方式，自己来通知数据的大小，再发送数据：

```java
    // 写
    DataOutputStream dos = new DataOutputStream(socket.getOutputStream());
    byte[] bytes = data.getBytes(StandardCharsets.UTF_8);
    dos.writeInt(bytes.length);
    dos.write(bytes);

	// 读
	DataInputStream dis = new DataInputStream(socket.getInputStream());
    int length=dis.readInt();
    byte[] data=new byte[length];
    dis.readFully(data);
    String message=new String(data, StandardCharsets.UTF_8);
```

到此我们可以得出 DataInputStream / DataOutputStream 传输数据的特点：

1. 传输完毕不需要关闭输出流，就可以开始下次传输（在一个socket连接下）
2. 丰富的读写方法支持，Java标准类型数据的读写，非常方便
3. writeUTF / readUTF 方法有发送数据限制，最大64k

根据上面几个特点，我们可以看出来 DataInputStream / DataOutputStream 更适合发送一些长度比较小的读数据，而且可以直接获取指定类型的数据。所以它适合用来发送一些控制信息，而不是比较大的数据信息。



### 3. InputStreamReader / OutputStreamWriter

InputStreamReader / OutputStreamWriter 是字符流对象，它的使用方法和 BufferedInputStream / BufferedOutputStream 类似，只是传输的基本单位换成了字符，还是需要 while 循环判断是否传输完毕，不过 InputStreamReader / OutputStreamWriter 可以设置传输的编码，可以节省写 byte -> String 的 decode步骤。 

```java
Writer osw = new OutputStreamWriter(socket.getOutputStream(), "UTF-8");
```

由于是字符流，InputStreamReader / OutputStreamWriter 更适合传输字符数据。



### 4. ObjectInputStream / ObjectOutputStream

ObjectInputStream / ObjectOutputStream 可以大致看作是 DataInputStream / DataOutputStream 的超集，它功能更加的完善。它也有 writeUTF / readUTF 方法，大小限制与 DataInputStream / DataOutputStream 的一样。而且一些基本类型的方法也是 ObjectInputStream / ObjectOutputStream 也有。

ObjectInputStream / ObjectOutputStream 最有用的方法就是 **writeObject / readObject**，我们可以将自己定义的类型对象直接使用这两个方法，发送和接收，只需要这个类继承 Serializable 接口，设置 serialVersionUID 属性值。

读

```java
ObjectInputStream ois = new ObjectInputStream(socket.getInputStream());
String message = (String) ois.readObject();
```

写

```java
ObjectOutputStream oos = new ObjectOutputStream(socket.getOutputStream());
oos.writeObject(message);
```

可以看出使用 ObjectInputStream / ObjectOutputStream 传输对象是非常方便的，它利用 Java 对象序列化和反序列化的机制，将对象的类、类的签名，以及类及其所有超类型的非瞬态和非静态字段的值写入到流中，接收端根据这些信息来恢复一个对象，而且从程序设计上没有传输长度的的限制。下面是详细的 writeObject 方法的代码：

```java
    /**
     * Write the specified object to the ObjectOutputStream.  The class of the
     * object, the signature of the class, and the values of the non-transient
     * and non-static fields of the class and all of its supertypes are
     * written.  Default serialization for a class can be overridden using the
     * writeObject and the readObject methods.  Objects referenced by this
     * object are written transitively so that a complete equivalent graph of
     * objects can be reconstructed by an ObjectInputStream.
     *
     * <p>Exceptions are thrown for problems with the OutputStream and for
     * classes that should not be serialized.  All exceptions are fatal to the
     * OutputStream, which is left in an indeterminate state, and it is up to
     * the caller to ignore or recover the stream state.
     *
     * @throws  InvalidClassException Something is wrong with a class used by
     *          serialization.
     * @throws  NotSerializableException Some object to be serialized does not
     *          implement the java.io.Serializable interface.
     * @throws  IOException Any exception thrown by the underlying
     *          OutputStream.
     */
    public final void writeObject(Object obj) throws IOException {
        if (enableOverride) {
            writeObjectOverride(obj);
            return;
        }
        try {
            writeObject0(obj, false);
        } catch (IOException ex) {
            if (depth == 0) {
                writeFatalException(ex);
            }
            throw ex;
        }
    }
```

根据注释我们可以推断，Java 语言的序列化机制产生的数据其实不是一种通用的数据传输格式（Json），它没有独立于语言， 高度依赖 Java（将对象的类、类的签名，以及类及其所有超类型的非瞬态和非静态字段写入流），其他语言写的程序也无法继承 Serializable 接口（哈哈哈）。所以这就是它最大的缺点，通信双方都只能是 Java 语言编写的程序。它的传输特点就是：

1. **writeObject / readObject** 没有传输长度限制
2. 需要传输的类继承 Serializable 接口，设置 serialVersionUID 属性值。传输双方类的 serialVersionUID需要一致（使用 writeObject / readObject）
3. 需要通信双方都是使用 Java 语言编写（使用 writeObject / readObject）
4. 可以使用更原始的写入输出方法，不使用 Java 对象序列化机制

根据特点来看 ObjectInputStream / ObjectOutputStream 类的功能还是非常全面的，它很适合在两个 Java 语言编写的 socket 程序间传输 Java对象序列化的数据，同时也能在不同的语言间传输通用的消息数据。（ObjectInputStream / ObjectOutputStream 是比较高级的包装流对象有writeObject / readObject 方法，但同时也同有 write，writeDouble， writeUTF， readInt， readFully 等方法）



> 最后由于这次的研究主要是为了让 Java 程序利用 adb 的 tcp 转发功能，完成与安卓App的通信，由于安卓上的 App 也是使用 Java 编写，所以最后的选择是使用 ObjectInputStream / ObjectOutputStream。如果有文件传输可以考虑使用 BufferedInputStream / BufferedOutputStream，但是最后文件是使用 adb pull 拉取的也就没有使用到。

