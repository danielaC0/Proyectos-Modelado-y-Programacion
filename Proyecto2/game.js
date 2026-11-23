document.addEventListener('DOMContentLoaded', function() {
    const grid = document.querySelector('.grid');
    const flagsLeft = document.querySelector('#flags-left');
    const levelSelect = document.querySelector('#level-select');
    const resultGame = document.querySelector('#result-game');
    /*let bombAmmount = 20
    console.log(grid);*/
    const levels = {
        easy: {cols: 9, rows: 9, mines: 10, cellsize: 40},
        intermediate: {cols:16, rows: 16, mines: 40, cellsize: 34},
        hard: {cols: 30, rows: 16, mines: 99, cellsize: 30} 
    };
    const order = ['easy', 'intermediate', 'hard'];
    let actualLevelKey = 'easy';
    let currentCols = 0;
    let currentRows = 0;
    let totalMines = 0;
    let flagsUsed = 0;
    let isGameOver = false;
    let squares = [];

    /*Inicializacion del juego*/
    function initGame(levelKey){
        actualLevelKey = levelKey;
        const {cols, rows, mines, cellsize} = levels[levelKey];

        currentCols = cols;
        currentRows = rows;
        totalMines = mines;
        flagsUsed = 0;
        isGameOver = false;
        squares = [];

        if(levelSelect){
            levelSelect.value = levelKey;
        }
        /*Reiniciar el tablero*/
        grid.innerHTML = '';
        flagsLeft.textContent = totalMines - mines;

        /*Ajustar el tablero al al nivel actual*/
        
        grid.style.width = `${cols * cellsize}px`;
        grid.style.height = `${rows * cellsize}px`;
        grid.style.display = `flex`;
        grid.style.flexWrap = `wrap`;

        /*Crear casillas*/
        createBoard(cols,rows,cellsize);
        createMines(cols * rows, totalMines, squares);
        addMineCounts(cols, rows, squares);
        
    }
    /*Creando el tablero*/
    function createBoard(cols, rows, cellsize){

        for(let i = 0; i < cols * rows; i++){
            const square = document.createElement('div')
            square.classList.add('square');
            square.id = i;
            square.dataset.index = String(i);
            square.dataset.mines = '0';
            square.style.width = `${cellsize}px`;
            square.style.height = `${cellsize}px`;
            square.style.lineHeight = `${cellsize -2}px`;

            /*Usar click derecho para poner o quitar banderas*/
            square.addEventListener('contextmenu', function(e){
                e.preventDefault();
                toggleFlag(square);
            });
            grid.appendChild(square);
            squares.push(square);

            /*Usar click izquierdo para mostrar las casillas*/
            square.addEventListener('click', function(){
                leftClick(square);
            })            

        }
    }
    /*Usar click izquierdo para mostrar las casillas*/
    function leftClick(square){
        if(isGameOver || square.classList.contains('checked') || square.classList.contains('flag')){
            return;
        }
        if(square.classList.contains('mine')){
            gameOver(square);
            return; 
        }
        revealSquare(square);
    }
    /*direcciones de las casillas vecinas*/
    const directions = [ [-1,-1], [-1,0], [-1,1], [0,-1], [0,1], [1,-1],[1,0], [1,1]];

    function countAdjMines(row,col,cols,rows,boardSquares,dirIndex){
        if(dirIndex >= directions.length) return 0;

        const[adjR,adjC] = directions[dirIndex];
        const newR = row + adjR;
        const newC = col + adjC;
        let found = 0;

        if (newR >= 0 && newC >= 0 && newR < rows && newC < cols){
            const neighborIndex = newR * cols + newC;
            if(boardSquares[neighborIndex].classList.contains('mine')){
                found = 1;
            }
        }
        return found + countAdjMines(row,col, cols, rows, boardSquares,dirIndex+1);
    }

    function addMineCounts(cols,rows,boardSquares, index = 0){
        if(index >= cols * rows) return; /*el indice se sale del tablero*/

        if(!boardSquares[index].classList.contains('mine')){
        const row = Math.floor(index / cols);
        const col = index % cols;
        const count = countAdjMines(row, col, cols, rows, boardSquares, 0);
        boardSquares[index].dataset.mines = String(count);
        }
        addMineCounts(cols,rows,boardSquares,index+1);
    }

    /*Funcion para generar las minas de manera aleatoria*/
    function createMines(totalSquares, minesCount, boardSquares){
        const minesCnt = Math.min(minesCount,totalSquares); /*No puede haber mas minas que casillas*/
        const minePosition = new Set();

        while(minePosition.size < minesCnt){
            const randomIndex = Math.floor(Math.random()*totalSquares);
            minePosition.add(randomIndex);
        }
        minePosition.forEach((index) =>{
            boardSquares[index].classList.add('mine');
        });
    }

    /*Funcion para mostrar una casilla*/
    function revealSquare(square){
        if(square.classList.contains('checked')|| square.classList.contains('flag')||square.classList.contains('mine')) return;

        square.classList.add('checked');
        const adjMines = Number(square.dataset.mines || 0);

        if(adjMines > 0 ){
            square.textContent = String(adjMines);
        }else{
            revealEmptyNeighbors(Number(square.dataset.index));
        }
    }
    
    /*Funcion para revelear las casillas que no estan etiquetadas ni han sido revisadas*/
    function revealEmptyNeighbors(index){
        const row = Math.floor(index / currentCols);
        const col = index % currentCols;

        for(const [adjR, adjC] of directions){
            const newR = row + adjR;    
            const newC = col + adjC;

            if(newR >= 0 && newC >= 0 && newR < currentRows && newC < currentCols){
                const neighbor = squares[newR * currentCols + newC];

                if(!neighbor.classList.contains('checked') && !neighbor.classList.contains('flag')){
                    revealSquare(neighbor);
                }
            }
        }
    }

    /*Funcion para marcar/ quitar las banderas de las casillas*/
    function toggleFlag(square){
        if(isGameOver || square.classList.contains('checked')) return;
        if(!square.classList.contains('flag')){
            if(flagsUsed >= totalMines) return;
            square.classList.add('flag');
            square.textContent = '🚩';
            flagsUsed++;
        }else{
            square.classList.remove('flag');
            square.textContent = '';
            flagsUsed--;
        }
        flagsLeft.textContent = totalMines-flagsUsed
    }
    
    if(levelSelect){
        levelSelect.addEventListener('change', (e) =>{
            initGame(e.target.value);
        });
    }

    function gameOver(visitedSquare){
        isGameOver = true;

        squares.forEach((sq) =>{
            if(sq.classList.contains('mine')){
                sq.classList.add('checked', 'reveal-mine');
                sq.textContent = '💣';
            }
        });

        visitedSquare.style.backgroundColor = '#e05252';
        if(resultGame){
            resultGame.textContent ='El juego ha terminado!';
        }
    }

    /*Cuando el jugador gane el nivel, podemos pasar al siguiente*/
    function nextLevel(){
        const idx = order.indexOf(actualLevelKey);
        if(idx !== -1 && idx < order.length -1){
             initGame(order[idx + 1]);
            }
        }
    
    initGame(actualLevelKey);
});