
window.onload = () => {

    //获取cavas环境
    const canvas = document.getElementById("viewport");
    const context = canvas.getContext("2d");

    //计算fps使用的参数
    let lastTimeStamp = 0,
        fpsTime = 0,
        frameCount = 0,
        fps = 0;

    let table = null;
    let snake = null;
    let food = null;

    let inputKey = 'right';
    let btnColor = "rgb(52, 133, 251)";

    let gameOver = false;
    let paused = false;
    let score = 0;

    //表格类
    const Table = class {
        constructor(columns, rows, elementSize) {      //行数，列数，单元格大小
            this.columns = columns;
            this.rows = rows;
            this.elementSize = elementSize;
            this.elements = [];
        }
        //初始化表格为一个二维数组
        init() {
            for (let i = 0; i <= this.rows - 1; i++) {
                this.elements[i] = [];
            }
        }
        //在表格填充数据，0表示空白，1表示墙
        fill() {
            for (let i = 0; i <= this.columns - 1; i++) {
                for (let j = 0; j <= this.rows - 1; j++) {
                    if (i === 0 || i === this.columns - 1 || j === 0 || j === this.rows - 1) {
                        this.elements[i][j] = 1;
                    } else {
                        this.elements[i][j] = 0;
                    }
                }
            }
        }
    }

    // 使用双向链表储存蛇的每一节身体在表格中的位置坐标
    const DoublyLinkedList = class {
        constructor() {
            this.head = null;
            this.tail = null;
        }
        // 向尾部添加节点
        append(node) {
            if (!this.head) {    //链表为空
                this.head = node;
                this.tail = node;
                return this;
            }
            this.tail.next = node;
            node.prev = this.tail;
            this.tail = node;
            return this;
        }
        //向头部添加节点
        addToHead(node) {
            this.head.prev = node;
            node.next = this.head;
            this.head = node;
            return this;
        }
        //删除尾部节点
        delTailNode() {
            this.tail = this.tail.prev;
            this.tail.next = null;
            return this;
        }
        //查找节点
        find(node) {
            let cur = this.head;
            while (cur) {
                if (node.x === cur.x && node.y === cur.y) {
                    return true;
                } else {
                    cur = cur.next
                }
            }
            return false;
        }
    }

    //蛇的类
    const Snake = class {
        constructor() {
            this.speed = 0;
            this.waitingTime = 0;
            this.body = null;
            this.direction = '';
        }
        init(x, y, length, speed, direction) {  //初始蛇头坐标，身体长度，移动速度，方向
            this.speed = speed;
            this.body = new DoublyLinkedList();
            this.direction = direction;
            for (let i = 0; i < length; i++) {
                this.body.append({ x, y })
                x--;
            }
        }
        //下一步的蛇头
        nextHead() {
            switch (this.direction) {
                case 'left':
                    return ({ x: this.body.head.x - 1, y: this.body.head.y });
                case 'right':
                    return ({ x: this.body.head.x + 1, y: this.body.head.y });
                case 'up':
                    return ({ x: this.body.head.x, y: this.body.head.y - 1 });
                case 'down':
                    return ({ x: this.body.head.x, y: this.body.head.y + 1 });
            }
        }
        //移动蛇
        move(nextHead) {
            this.body.addToHead(nextHead);
            this.body.delTailNode();
        }
        //蛇长大
        grow(nextHead) {
            this.body.addToHead(nextHead);
        }
        //根据按键确定下一步运动方向
        nextDirection(inputKey) {
            if (inputKey === 'left') {                     
                if (this.direction != 'right') {
                this.direction = 'left';
                }
            } else if (inputKey === 'up') {            
                if (this.direction != 'down') {
                    this.direction = 'up';
                }
            } else if (inputKey === 'right') {               
                if (this.direction != 'left') {
                    this.direction = 'right';
                }
            } else if (inputKey === 'down') {               
                if (this.direction != 'up') {
                    this.direction = 'down';
                }
            } 
        }

    }

    //游戏初始化
    const init = () => {
        //鼠标点击事件处理
        canvas.addEventListener("mousedown", handleMouseDown);
        canvas.addEventListener("mousemove", handleMouseMove);
        //键盘事件
        document.addEventListener("keydown", handleKeyDown);

        //生成表格
        table = new Table(40, 40, 10);
        table.init();
        table.fill();

        //初始化蛇
        snake = new Snake();
        snake.init(10, 20, 3, 3, 'right');

        //添加食物
        addFood();

        //进入主循环              
        mainLoop(0);
    };

    //重新开局
    const restart = () => {
        //初始化变量
        gameOver = false;
        paused = false;
        score = 0;
        inputKey = 'right';

        //生成表格
        table = new Table(40, 40, 10);
        table.init();
        table.fill();

        //初始化蛇
        snake = new Snake();
        snake.init(10, 20, 3, 3, 'right');

        //添加食物
        addFood();
    };

    const addFood = () => {
        let x = Math.floor(Math.random() * (table.columns - 2) + 1);
        let y = Math.floor(Math.random() * (table.rows - 2) + 1);
        food = { x, y };
        // 随机食物不可出现在蛇的身体上
        while (snake.body.find(food)) {
            x = Math.floor(Math.random() * (table.columns - 2) + 1);
            y = Math.floor(Math.random() * (table.rows - 2) + 1);
            food = { x, y };
        }
        //表格中2表示食物
        table.elements[x][y] = 2;
    };

    //游戏主循环    
    const mainLoop = (timeStamp) => {
        //安排游戏下一帧画面的渲染，异步
        window.requestAnimationFrame(mainLoop);
        //内容更新
        update(timeStamp);
        //渲染画面
        render();
    };

    const update = (timeStamp) => {
        //两帧画面之间所用的时间
        let deltaT = (timeStamp - lastTimeStamp) / 1000;
        lastTimeStamp = timeStamp;
        //更新帧率
        updateFps(deltaT);
        //更新蛇的属性
        updateSnake(deltaT);
    };

    const updateFps = (deltaT) => {
        //每0.25秒更新一次帧率        
        if (fpsTime > 0.25) {
            fps = Math.round(frameCount / fpsTime);
            frameCount = 0;
            fpsTime = 0;
        } else {
            fpsTime += deltaT;
            frameCount++;
        }
    };

    const updateSnake = (deltaT) => {
        //判断蛇进行下一步移动前需延迟的时间是否满足
        let mustDelay = 1 / snake.speed;
        snake.waitingTime += deltaT;

        if (snake.waitingTime > mustDelay && !paused) {
            //下一步蛇头的位置
            snake.nextDirection(inputKey);
            let nextHead = snake.nextHead();
            //撞墙
            if (nextHead.x < 1 || nextHead.x >= table.columns - 1 || nextHead.y < 1 || nextHead.y >= table.rows - 1) {
                gameOver = true;
            }
            //撞到自己的身体
            if (snake.body.find(nextHead)) {
                gameOver = true;
            }
            //吃食物
            if (nextHead.x === food.x && nextHead.y === food.y) {
                snake.grow(nextHead);
                table.elements[food.x][food.y] = 0;
                addFood();
                score++;
                adjustSpeed();
                snake.waitingTime = 0;
            } else if (!gameOver) {             //向前移动
                snake.move(nextHead);
                snake.waitingTime = 0;
            }
        };
    };

    //根据得分调整速度
    const adjustSpeed = () => {
        if (score % 5 === 0) {
            snake.speed *= 1.1;
        }
    };

    const render = () => {
        //绘制游戏界面
        drawTable();
        drawFps();
        drawScore();
        drawButton();
        //绘制蛇
        drawSnake();
        //绘制食物
        drawFood();
        //失败与暂停提示
        if (gameOver) {
            drawGameOver();
        } else if (paused) {
            drawPaused();
        }
    };

    const drawTable = () => {
        context.fillStyle = "black";
        context.fillRect(0, 0, table.columns * table.elementSize, table.rows * table.elementSize);
        context.fillStyle = "white";
        context.fillRect(table.elementSize, table.elementSize, (table.columns - 2) * table.elementSize, (table.rows - 2) * table.elementSize);
        context.fillRect(table.columns * table.elementSize + 1, 0, canvas.width, canvas.height);
    };

    const drawScore = () => {
        context.fillStyle = "#000";
        context.font = "20px Ariel";
        context.textAlign = "left";
        context.fillText("Score: " + score, 420, 100);
    };

    const drawFps = () => {
        context.fillStyle = "#000";
        context.font = "14px Ariel";
        context.textAlign = "left";
        context.fillText("FPS: " + fps, 420, 20);
    };

    const drawSnake = () => {
        let currentNode = snake.body.head;
        while (currentNode) {
            context.strokeStyle = "black";
            context.strokeRect(currentNode.x * table.elementSize, currentNode.y * table.elementSize, table.elementSize, table.elementSize)
            currentNode = currentNode.next;
        }
    };

    const drawFood = () => {
        context.fillStyle = "red";
        context.fillRect(food.x * table.elementSize, food.y * table.elementSize, table.elementSize, table.elementSize);
    };

    const drawGameOver = () => {
        context.fillStyle = "rgba(255, 0, 0, 0.3)";
        context.fillRect(80, 150, 240, 90);
        context.fillStyle = "black";
        context.font = "24px Ariel";
        context.textAlign = "center";
        context.fillText("Game Over", 200, 200);
    };

    const drawPaused = () => {
        context.fillStyle = "rgba(0, 255, 0, 0.3)";
        context.fillRect(80, 150, 240, 90);
        context.fillStyle = "black";
        context.font = "24px Ariel";
        context.textAlign = "center";
        context.fillText("Game Paused", 200, 200);
    };

    const drawButton = () => {
        context.fillStyle = btnColor;
        context.fillRect(420, 350, 85, 35);
        let text = '';
        if (!gameOver) {
            if (paused) {
                text = 'Resume';
            } else {
                text = 'Pause';
            }
        } else {
            text = 'Restart';
        }

        context.fillStyle = "#fff";
        context.font = "18px Ariel";
        context.textAlign = "center";
        context.fillText(text, 463, 375);
    };


    const handleMouseDown = (event) => {
        //获取鼠标位置
        let pos = getMousePos(event);
        //按钮逻辑
        if (pos.x >= 420 && pos.x <= 505 && pos.y >= 350 && pos.y <= 385) {
            if (!gameOver) {
                paused = !paused;
            } else {
                restart();
            }
        }
    };

    const handleMouseMove = (event) => {
        //改变按钮颜色
        let pos = getMousePos(event);
        if (pos.x >= 420 && pos.x <= 505 && pos.y >= 350 && pos.y <= 385) {
            btnColor = "rgb(67, 149, 255)";
        } else {
            btnColor = "rgb(52, 133, 251)";
        }
    };

    const getMousePos = (event) => {
        let rec = canvas.getBoundingClientRect();
        return {
            x: Math.round((event.clientX - rec.left) / (rec.right - rec.left) * canvas.width),
            y: Math.round((event.clientY - rec.top) / (rec.bottom - rec.top) * canvas.height)
        }
    };

    const handleKeyDown = (event) => {
        if (event.keyCode === 37 || event.keyCode === 65) {          //左方向键或A键            
            inputKey = 'left';
        } else if (event.keyCode === 38 || event.keyCode === 87) {   //上方向键或W键            
            inputKey = 'up';
        } else if (event.keyCode === 39 || event.keyCode === 68) {   //右方向键或D键            
            inputKey = 'right';
        } else if (event.keyCode === 40 || event.keyCode === 83) {   //下方向键或S键            
            inputKey = 'down';
        } else if (event.keyCode === 32) {                           //空格键暂停或重开局
            if (!gameOver) {
                paused = !paused;
            } else {
                restart();
            }            
        }
    };

    init();
}



