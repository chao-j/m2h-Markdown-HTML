/**
 * Markdown-HTML������
 * @param options ѡ����� table_cap �Ƿ����ñ��ͷ
 * @returns {{parse: parse}}
 * @constructor
 */
var M2h=function(options){
    var table_index=1; //���ͷ�������
    var htmlDoc;       //���ս����Ľ��
    //ƥ�������ģʽ
    var patterns={
        header:/^(( *)#{1,6} )/g,
        list:/^(( *)[+|\-|\*|\d\.])/,
        quote:/^( *> )/,
        code_block:/^(( *)```)/,
        table:/^(( *)(\|.*){2,})/
    };
    //ƥ���滻�����ҵ�ģʽ
    var searchPatt={
        header:/(#{1,6} )/g,
        list:/[+|\-|\*|\d\.]/,
        ulli:/( *)[+|\-|\*]( )/,
        olli:/( *)\d\./
    };

    //��¶�ķ��� ��md��ʽ�ı�������HTML
    function parse(md,callback){
        var lines=md.split(/\r\n/); //�����н���
        lines.push(""); //���һ����ӿ��� ����߽��ж�

        htmlDoc=document.createElement("div");
        htmlDoc.setAttribute("class","m2h");
        dispatcher(lines);
        callback(htmlDoc);
    }

    //�ַ��� ����ƥ��ģʽ���в�ͬ���͵Ľ���
    function dispatcher(lines){
        var i=0;
        while(i<lines.length){
            let line=lines[i];
            //����
			if(patterns.header.test(line)){
                packerHeader(line);
			}
            //��� ���������б�ǰ
            else if(patterns.table.test(line)){
                let table = new Array();
                while (line.trim() != "") {
                    table.push(line);
                    line = lines[++i];
                }
                packerTable(table);
            }
            //�б�
            else if(patterns.list.test(line)){
                let list=new Array();
                while(line.trim()!=""){
                    list.push(line);
                    line=lines[++i];
                }
                packerList(list)
            }
            //����
            else if(patterns.quote.test(line)){
                let quote=new Array();
                while(line.trim()!=""){
                    quote.push(line);
                    line=lines[++i];
                }
                packerQuote(quote);
            }
            //�����
            else if(patterns.code_block.test(line)) {
                let code_block = new Array();
                while (line.trim() != "```") {
                    code_block.push(line);
                    line = lines[++i];
                }
                packerCodeBlock(code_block);
            }
            //��ͨ����
            else if(line.trim()!=""){
                packerSection(line)
            }
            i++;
        }
    }

    //��ͨ����
    function packerSection(line){
        var margin=line.match(/( *)/)[0].length;
        var section=document.createElement("p");
        section.setAttribute("style","margin-left:"+margin/2+"em");  //���������Ķ���
        section.innerHTML=parseInline(line);
        htmlDoc.appendChild(section)
    }

    //�б�
    //ʹ��ջ����Ƕ�׹���
    /*
    д��һ�죬���˸��ַ�������������ȷ�������뵽��ջ����Ȼû��һ��ע�͵�д���ˣ���������ţ��������������
     */
    function packerList(listArr){
        //ջ�ĳ�ʼ��
        var stack=new Array();
        var level=listArr[0].match(patterns.list)[0].length-1;
        var tag=searchPatt.ulli.test(listArr[0])?"ul":"ol";
        var root=document.createElement(tag);
        root.setAttribute("style","margin-left:"+level/2+"em"); //����
        stack.push({elem:root,lv:level});

        listArr.forEach(function (line) {
            level=line.match(patterns.list)[0].length-1;
            var li=document.createElement("li");

            //��Ԫ�ؽ��� �˻���һ��
            if(level<stack[stack.length-1].lv){
                stack.pop();
                //console.log("<",line)
            }

            //ͬ�� ֱ�����
            if(level==stack[stack.length-1].lv){
                line=line.replace(searchPatt.olli,"").replace(searchPatt.ulli,"");
                li.innerHTML=parseInline(line);
                stack[stack.length-1].elem.appendChild(li);
                //console.log("=",line)
            }

            //��ҪǶ��
            else if(level>stack[stack.length-1].lv){
                //�½�һ��ul/ol ��Ϊ��һ���ӽڵ�
                tag=searchPatt.ulli.test(line)?"ul":"ol";
                root=document.createElement(tag);
                stack[stack.length-1].elem.appendChild(root);
                //���½���ul/ol ��Ϊջ��Ԫ��
                stack.push({elem:root,lv:level});
                //���µ�ջ�������li
                line=line.replace(searchPatt.olli,"").replace(searchPatt.ulli,"");
                li.innerHTML=parseInline(line);
                stack[stack.length-1].elem.appendChild(li);
                //console.log(">",line)
            }
        });
        htmlDoc.appendChild(stack[0].elem)
    }

    //����
    //TODO �Ƿ���ҪǶ�ף���
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
    //�����
    function packerCodeBlock(code){
        var pre=document.createElement("pre");
        var div=document.createElement("div");
        var span=document.createElement("span");
        div.setAttribute("class","code-block");
        var language=code[0].replace(/```/,"").trim(); //��������
        //��������
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

    //����
    function packerHeader(line){
        //var margin=line.search(searchPatt.header); //�������� TODO�������Ƿ���������
        var innerText=line.replace(patterns.header,""); //��������
        var level=line.match(searchPatt.header)[0].length-1; //����ȼ�
        var header=document.createElement("h"+level);
        header.innerHTML=parseInline(innerText);
        htmlDoc.appendChild(header);
    }
    //���
    function packerTable(tableArr){
        var table=document.createElement("table");
        var thead=document.createElement("thead");
        var tbody=document.createElement("tbody");
        table.setAttribute("border","1");
        //ȥ������
        tableArr=tableArr.map(function(row){
            return row.trim();
        });
        tableArr.forEach(function(row,index){
            if(index==1) return false; //�����ڶ���

            var tag=index==0?'th':'td'; //��Ԫ��ı�ǩ����
            var cols=row.split("|");     //ȡ�õ�Ԫ������
            //���ΪtrԪ��
            var tr=document.createElement("tr");
            cols=cols.slice(1,cols.length-1);  //split�ķָ��������ʱ�����˻���һ�����ַ���
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
        ////�Ƿ���ӱ�ͷ
        if(options&&options.table_cap){
            var cap=document.createElement("caption");
            cap.innerText="T-"+table_index;
            table_index++;
            table.appendChild(cap);
        }

        htmlDoc.appendChild(table);
    }

    //�������
    var codePatt={
        variable:/(var|int)/g,
        comment:/(\/\/.*)/,
        multi_comment:/\/\*.*\*\//,
        tag:/(&lt;.*?&gt;)/g
    };

    //������д���Ľ���
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

    //�����ı��Ľ���
    function parseInline(innerHTML){
        //��Ϊǰ����滻���ܳ��ֺ�����ַ� ���˳������ ��ʱû�ҵ�����취
        //�滻��``�ڵ�<��>
        while(/`.*<.*`/.test(innerHTML)||/`.*>.*`/.test(innerHTML)){
            innerHTML= innerHTML.replace(/(`.*)<(.*`)/,"$1&lt;$2")
            innerHTML= innerHTML.replace(/(`.*)>(.*`)/,"$1&gt;$2")
        }
        //TODO Typora�� ����û��alt �������ﲻ��
        //ͼƬ  ----��̰��ƥ�䣡��������
        innerHTML=innerHTML.replace(/!\[alt (.+?)]\((.+) "(.+?)"\)/,'<img alt="$1" title="$3" src="$2"/>'); //���������ӽ���ǰ����ֹ����Ϊ����
        innerHTML=innerHTML.replace(/!\[alt (.+?)]\((.+?)\)/,'<img alt="$1" src="$2" title="$1"/>');
        //����
        // BUG�ѽ��:<>��ʽ�����ӵ�һ���ַ��ᱻ�滻��ԭ����Ϊ�˷�ֹ������ͼƬ�ȣ� ���˼·����()����ƥ��Ŀ�ͷ
        innerHTML=innerHTML.replace(/<([^u|^/u|^img])(.+?)>/g,"<a href=\"$1$2\">$1$2</a>");  //��ֹ�����<u>���Ѿ�������<img>
        innerHTML=innerHTML.replace(/\[(.+?)]\((.+?)\)/g,"<a href=\"$2\">$1</a>");


        //����Ƭ��
        innerHTML=innerHTML.replace(/`(.+?)`/g,"<code>$1</code>");

        //���� б��
        innerHTML=innerHTML.replace(/\*{3}(.+?)\*{3}|_{3}(.+?)_{3}/g,"<strong><i>$1$2</i></strong>");
        innerHTML=innerHTML.replace(/\*{2}(.+?)\*{2}|_{2}(.+?)_{2}/g,"<strong>$1$2</strong>");
        innerHTML=innerHTML.replace(/\*(.+?)\*|_(.+?)_/g,"<i>$1$2</i>");
        //ɾ����
        innerHTML=innerHTML.replace(/~{2}(.+?)~{2}/g,"<del>$1</del>");

        //�ϱ� �±�
        innerHTML=innerHTML.replace(/~(.+?)~/g,"<sub>$1</sub>");
        innerHTML=innerHTML.replace(/\^(.+?)\^/g,"<sup>$1</sup>");
        //�»���ʹ��<u></u> �������
        //TODO����ע
        return innerHTML;
    }

    return {
        parse:parse
    }
};