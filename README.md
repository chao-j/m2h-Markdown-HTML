# M2h Markdown文本转HTML

### 简单使用

简单的Markdown-HTML解析器，原生JavaScript编写，利用正则表达式匹配解析，使用`<script>`标签引入文件即可

```html
<script src="./m2h.js"></script>
```

使用前需要构造对象，构造函数为`new M2h(options)`，其中`options`为对象类型，目前只有唯一属性：`options.table_cap`，如果该属性为true，则会为文档中的表格进行编号索引，若不需要，可以不提供`options`参数

实例方法`parse(md,callback)`为暴露的唯一方法，参数一为md格式文本内容，参数二为回调函数，解析完成后调用，回调参数传入一个包含所有内容的`<div>`，该标签具有`class="m2h"`属性

```javascript
var m2h=new M2h({table_cap:true});
m2h.parse(mdDoc,function(data){
    document.getElementById("container").appendChild(data)
})
```

`m2h.css`为针对解析出的内容的样式表，所有样式都是针对`.m2h`的后代元素，不会污染页面中其他元素

```html
<link rel="stylesheet" href="m2h.css">
```

### 支持格式

解析器可以简单的解析以下格式

+ 标题

    解析atx形式标题，即

    ```markdown
    # 标题1
    ### 标题3
    ###### 标题6
    ```

+ 列表

    能够解析`*`、`+`、`-`以及`1.`形式标记的列表，自动解析嵌套等级（要求子级列表和父级列表有一个`tab`的缩进，在Markdown编辑器中，这是自动生成的），不同组的列表之间，应该有空行分隔

    ```markdown
    + 列表
    + 列表
    	+ 列表
    	+ 列表
    	
    1. 列表
    2. 列表
    ```

+ 表格

    支持合法的Markdown表格，即形如

    ```markdown
    |表头1|表头2|表头3|
    |---|---|---|
    |表项1|表项2|表项3|
    ```

    演示：

    | 表头1 | 表头2 | 表头3 |
    | ----- | ----- | ----- |
    | 表项1 | 表项2 | 表项3 |

+ 区块

    支持区块，但是多级区块不会嵌套，区块中支持格式化文本，暂不支持列表

    ```markdown
    > 这是一个区块
    >
    > 这是一个区块
    >
    > > 区块2`<a>`
    ```

    演示

    > 这是一个区块
    >
    > 这是一个区块
    >
    > > 区块2`<a>`

+ 代码块

    支持代码块

    ```markdown
    ​```javascript
    var i=0;
    console.log(i);
    ​```
    ```

    

+ 段落文本

    空行产生一个段落，如下为两个段落

    ```markdown
    段落1
    
    段落2
    ```

    此外，段落内支持格式化文本，行内代码片段，图片，链接等
    
    + 格式化文本
    
        支持**粗体**，*斜体*，***斜体加粗***，~~删除线~~，<u>下划线</u>，上标：8^2^，下标：a~0~
    
        ```markdown
         支持**粗体**，*斜体*，***斜体加粗***，~~删除线~~，<u>下划线</u>，上标：8^2^，下标：a~0~
        ```
    
    + 代码片段
    
        支持代码片段：`var i=0;console.log(i);`
    
        ```html
        支持代码片段：`var i=0;console.log(i);`
        ```
    
    + 图片
    
        支持图片![alt 图片](http://cdn.zhaocj.top/blog/m2h_introduce.jpg)
    
        ```markdown
        ![alt 图片](http://cdn.zhaocj.top/blog/m2h_introduce.jpg)
        ![alt 图片](http://cdn.zhaocj.top/blog/m2h_introduce.jpg "title")
        ```
    
    + 链接
    
        显示文字的链接[我的博客](https://www.zhaocj.top)，显示地址的链接<https://www.zhaocj.top>
    
        ```markdown
        显示文字的链接[我的博客](https://www.zhaocj.top)，显示地址的链接<https://www.zhaocj.top>
        ```

### 限制

+ 段落、区块、列表、表格、代码块之间必须有空行
+ 图片必须有alt标识，即`![alt 图片]`
+ 代码块无高亮
+ 其他尚未发现的解析bug