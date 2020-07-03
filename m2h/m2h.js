/**
 * Markdown-HTML解析器
 * @param options 选项对象 table_cap 是否设置表格头
 * @returns {{parse: parse}}
 * @constructor
 */
var M2h=function(options){
    var table_index=1; //表格头索引序号
    var htmlDoc;       //最终解析的结果
    //匹配解析的模式
    var patterns={
        header:/^(( *)#{1,6} )/g,
        list:/^(( *)[+|\-|\*|\d\.])/,
        quote:/^( *> )/,
        code_block:/^(( *)```)/,
        table:/^(( *)(\|.*){2,})/
    };
    //匹配替换、查找的模式
    var searchPatt={
        header:/(#{1,6} )/g,
        list:/[+|\-|\*|\d\.]/,
        ulli:/( *)[+|\-|\*]( )/,
        olli:/( *)\d\./
    };

    //暴露的方法 将md格式文本解析问HTML
    function parse(md,callback){
        var lines=md.split(/\r\n/); //基于行解析
        lines.push(""); //最后一行添加空行 方便边界判断

        htmlDoc=document.createElement("div");
        htmlDoc.setAttribute("class","m2h");
        dispatcher(lines);
        callback(htmlDoc);
    }

    //分发器 根据匹配模式进行不同类型的解析
    function dispatcher(lines){
        var i=0;
        while(i<lines.length){
            let line=lines[i];
            //标题
			if(patterns.header.test(line)){
                packerHeader(line);
			}
            //表格 表格必须在列表前
            else if(patterns.table.test(line)){
                let table = new Array();
                while (line.trim() != "") {
                    table.push(line);
                    line = lines[++i];
                }
                packerTable(table);
            }
            //列表
            else if(patterns.list.test(line)){
                let list=new Array();
                while(line.trim()!=""){
                    list.push(line);
                    line=lines[++i];
                }
                packerList(list)
            }
            //区块
            else if(patterns.quote.test(line)){
                let quote=new Array();
                while(line.trim()!=""){
                    quote.push(line);
                    line=lines[++i];
                }
                packerQuote(quote);
            }
            //代码块
            else if(patterns.code_block.test(line)) {
                let code_block = new Array();
                while (line.trim() != "```") {
                    code_block.push(line);
                    line = lines[++i];
                }
                packerCodeBlock(code_block);
            }
            //普通段落
            else if(line.trim()!=""){
                packerSection(line)
            }
            i++;
        }
    }

    //普通段落
    function packerSection(line){
        var margin=line.match(/( *)/)[0].length;
        var section=document.createElement("p");
        section.setAttribute("style","margin-left:"+margin/2+"em");  //整体缩进的段落
        section.innerHTML=parseInline(line);
        htmlDoc.appendChild(section)
    }

    //列表
    //使用栈进行嵌套构建
    /*
    写了一天，试了各种方法都解析不正确，晚上想到用栈，竟然没用一行注释的写完了！！！！！牛批！！！！！！
     */
    function packerList(listArr){
        //栈的初始化
        var stack=new Array();
        var level=listArr[0].match(patterns.list)[0].length-1;
        var tag=searchPatt.ulli.test(listArr[0])?"ul":"ol";
        var root=document.createElement(tag);
        root.setAttribute("style","margin-left:"+level/2+"em"); //缩进
        stack.push({elem:root,lv:level});

        listArr.forEach(function (line) {
            level=line.match(patterns.list)[0].length-1;
            var li=document.createElement("li");

            //子元素结束 退回上一级
            if(level<stack[stack.length-1].lv){
                stack.pop();
                //console.log("<",line)
            }

            //同级 直接添加
            if(level==stack[stack.length-1].lv){
                line=line.replace(searchPatt.olli,"").replace(searchPatt.ulli,"");
                li.innerHTML=parseInline(line);
                stack[stack.length-1].elem.appendChild(li);
                //console.log("=",line)
            }

            //需要嵌套
            else if(level>stack[stack.length-1].lv){
                //新建一个ul/ol 作为上一级子节点
                tag=searchPatt.ulli.test(line)?"ul":"ol";
                root=document.createElement(tag);
                stack[stack.length-1].elem.appendChild(root);
                //将新建的ul/ol 作为栈顶元素
                stack.push({elem:root,lv:level});
                //在新的栈顶中添加li
                line=line.replace(searchPatt.olli,"").replace(searchPatt.ulli,"");
                li.innerHTML=parseInline(line);
                stack[stack.length-1].elem.appendChild(li);
                //console.log(">",line)
            }
        });
        htmlDoc.appendChild(stack[0].elem)
    }

    //区块
    //TODO 是否需要嵌套？？
    function packerQuote(quoteArr){
        var div=document.createElement("div");
        div.setAttribute("class","quote");
        var content="";
        quoteArr.forEach(function(line){
            console.log(line);
            if(line.trim()==">"){
                content+="</br>"
            }
            else{
                line=line.replace(/(> )+/g,"&emsp;").replace(/^>$/,"");
                content+=parseInline(line)+"</br>";
            }
            console.log(content)
        });
        div.innerHTML=content;
        htmlDoc.appendChild(div)
    }
    //代码块
    function packerCodeBlock(code){
        var pre=document.createElement("pre");
        var div=document.createElement("div");
        var span=document.createElement("span");
        div.setAttribute("class","code-block");
        var language=code[0].replace(/```/,"").trim(); //代码语言
        //代码内容
        var content="";
        code=code.splice(1,code.length-1);
        code.forEach(function (e) {
            content+=e+"\r\n";
        });
        pre.innerHTML=parseCode(content);
        span.innerText=language;
        div.appendChild(pre);
        div.appendChild(span);
        htmlDoc.appendChild(div);
    }

    //标题
    function packerHeader(line){
        //var margin=line.search(searchPatt.header); //标题缩进 TODO：标题是否允许缩进
        var innerText=line.replace(patterns.header,""); //标题内容
        var level=line.match(searchPatt.header)[0].length-1; //标题等级
        var header=document.createElement("h"+level);
        header.innerHTML=parseInline(innerText);
        htmlDoc.appendChild(header);
    }
    //表格
    function packerTable(tableArr){
        var table=document.createElement("table");
        var thead=document.createElement("thead");
        var tbody=document.createElement("tbody");
        table.setAttribute("border","1");
        //去除缩进
        tableArr=tableArr.map(function(row){
            return row.trim();
        });
        tableArr.forEach(function(row,index){
            if(index==1) return false; //跳过第二行

            var tag=index==0?'th':'td'; //单元格的标签类型
            var cols=row.split("|");     //取得单元格内容
            //组合为tr元素
            var tr=document.createElement("tr");
            cols=cols.slice(1,cols.length-1);  //split的分割符在两端时，两端会多出一个空字符串
            cols.forEach(function(col){
                var temp=document.createElement(tag);
                temp.innerHTML=parseInline(col.trim());
                tr.appendChild(temp);
            });
            if(index==0){
                thead.appendChild(tr);
            }else{
                tbody.appendChild(tr);
            }
        });
        table.appendChild(thead);
        table.appendChild(tbody);
        ////是否添加表头
        if(options&&options.table_cap){
            var cap=document.createElement("caption");
            cap.innerText="T-"+table_index;
            table_index++;
            table.appendChild(cap);
        }

        htmlDoc.appendChild(table);
    }

    //代码高亮
    var codePatt={
        variable:/(var|int)/g,
        comment:/(\/\/.*)/,
        multi_comment:/\/\*.*\*\//,
        tag:/(&lt;.*?&gt;)/g
    };

    //代码块中代码的解析
    function parseCode(innerHTML){
        innerHTML= innerHTML.replace(/</g,"&lt;");
        innerHTML= innerHTML.replace(/>/g,"&gt;");
        /*
        innerHTML=innerHTML.replace(codePatt.variable,'<code class="var">$1</code>');
        innerHTML=innerHTML.replace(codePatt.comment,'<code class="comment">$1</code>');
        innerHTML=innerHTML.replace(codePatt.tag,'<code class="tag">$1</code>');
        innerHTML=innerHTML.replace(codePatt.multi_comment,'<code class="comment">$1</code>');
        */
        return innerHTML;
    }

    //内联文本的解析
    function parseInline(innerHTML){
        //因为前面的替换可能出现后面的字符 因此顺序不能乱 暂时没找到解决办法
        //替换掉``内的<和>
        while(/`.*<.*`/.test(innerHTML)||/`.*>.*`/.test(innerHTML)){
            innerHTML= innerHTML.replace(/(`.*)<(.*`)/,"$1&lt;$2")
            innerHTML= innerHTML.replace(/(`.*)>(.*`)/,"$1&gt;$2")
        }
        //TODO Typora中 可以没有alt 但是这里不行
        //图片  ----非贪婪匹配！！！！！
        innerHTML=innerHTML.replace(/!\[alt (.+?)]\((.+) "(.+?)"\)/,'<img alt="$1" title="$3" src="$2"/>'); //必须在链接解析前，防止解析为链接
        innerHTML=innerHTML.replace(/!\[alt (.+?)]\((.+?)\)/,'<img alt="$1" src="$2" title="$1"/>');
        //链接
        // BUG已解决:<>形式的链接第一个字符会被替换（原因是为了防止解析掉图片等） 解决思路：用()保留匹配的开头
        innerHTML=innerHTML.replace(/<([^u|^/u|^img])(.+?)>/g,"<a href=\"$1$2\">$1$2</a>");  //防止误解析<u>和已经解析的<img>
        innerHTML=innerHTML.replace(/\[(.+?)]\((.+?)\)/g,"<a href=\"$2\">$1</a>");


        //代码片段
        innerHTML=innerHTML.replace(/`(.+?)`/g,"<code>$1</code>");

        //粗体 斜体
        innerHTML=innerHTML.replace(/\*{3}(.+?)\*{3}|_{3}(.+?)_{3}/g,"<strong><i>$1$2</i></strong>");
        innerHTML=innerHTML.replace(/\*{2}(.+?)\*{2}|_{2}(.+?)_{2}/g,"<strong>$1$2</strong>");
        innerHTML=innerHTML.replace(/\*(.+?)\*|_(.+?)_/g,"<i>$1$2</i>");
        //删除体
        innerHTML=innerHTML.replace(/~{2}(.+?)~{2}/g,"<del>$1</del>");

        //上标 下标
        innerHTML=innerHTML.replace(/~(.+?)~/g,"<sub>$1</sub>");
        innerHTML=innerHTML.replace(/\^(.+?)\^/g,"<sup>$1</sup>");
        //下划线使用<u></u> 无需解析
        //TODO：脚注
        return innerHTML;
    }

    return {
        parse:parse
    }
};