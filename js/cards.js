// js/cards.js

/**
 * Generador de cartones de Bingo Español (90 bolas).
 * Riguroso cumplimiento de reglas: 3 filas x 9 columnas, 15 números.
 */
export class CardGenerator {
    cols = 9;
    rows = 3;

    /**
     * Genera un único cartón de bingo válido.
     * @returns {object} Estructura del cartón: { id: string, matrix: array[3][9] }
     * Donde matrix[r][c] es el número o null/0 si está vacío.
     */
    generateCard() {
        let attempts = 0;
        const maxAttempts = 1000;

        while (attempts < maxAttempts) {
            attempts++;
            try {
                // 1. Determinar cuántos números van en cada columna
                // Total 15 números. Min 1 por columna, Max 3.
                // 9 columnas mandatorios 1 número = 9. Quedan 6 para distribuir.
                const colCounts = this._generateColumnCounts();

                // 2. Generar los números reales para cada columna
                const colNumbers = this._generateColumnNumbers(colCounts);

                // 3. Asignar posiciones en la rejilla (3x9)
                // Debe cumplir que cada fila tenga exactamente 5 números.
                const layout = this._generateLayout(colCounts); // Retorna boolean[3][9]

                // 4. Rellenar la rejilla
                const matrix = this._fillMatrix(layout, colNumbers);

                // 5. Generar ID único
                const id = this._generateHash(matrix);

                return {
                    id: id,
                    matrix: matrix, // 0 para espacios vacíos, número para casillas llenas
                    numbers: colNumbers.flat().sort((a, b) => a - b) // Lista plana para validacion rapida
                };

            } catch {
                // Si falla la generación por restricciones (backtracking fallido), reintentar.
                continue;
            }
        }
        throw new Error("No se pudo generar un cartón válido después de múltiples intentos.");
    }

    /**
     * Genera n cartones
     * @param {number} n Cantidad
     */
    generateBatch(n) {
        const batch = [];
        const ids = new Set();
        while (batch.length < n) {
            const card = this.generateCard();
            if (!ids.has(card.id)) {
                ids.add(card.id);
                batch.push(card);
            }
        }
        return batch;
    }

    /**
     * Abre ventana de impresión para los cartones
     * @param {Array} cards Array de objetos cartón
     */
    printCards(cards) {
        const printWindow = window.open('', '_blank');
        if (!printWindow) {
            alert("Por favor habilita los popups para imprimir cartones.");
            return;
        }

        const doc = printWindow.document;
        const styleEl = doc.createElement('style');
        styleEl.textContent = `
            @media print {
                @page { size: A4; margin: 1cm; }
                body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            }
            body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                background: white;
                color: black;
                display: flex;
                flex-wrap: wrap;
                justify-content: center;
                gap: 20px;
                padding: 20px;
            }
            .page-break {
                page-break-after: always;
                width: 100%;
                height: 0;
            }
            .card {
                border: 2px solid #000;
                width: 18cm;
                height: auto;
                padding: 10px;
                box-sizing: border-box;
                margin-bottom: 20px;
            }
            .card-header {
                display: flex;
                justify-content: space-between;
                font-size: 12px;
                margin-bottom: 5px;
                text-transform: uppercase;
                border-bottom: 1px solid #ccc;
            }
            .grid {
                display: grid;
                grid-template-columns: repeat(9, 1fr);
                border-top: 2px solid #000;
                border-left: 2px solid #000;
            }
            .cell {
                border-right: 2px solid #000;
                border-bottom: 2px solid #000;
                height: 40px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 24px;
                font-weight: bold;
            }
            .cell.empty {
                background: repeating-linear-gradient(
                    45deg,
                    #f0f0f0,
                    #f0f0f0 2px,
                    #fff 2px,
                    #fff 4px
                );
            }
        `;
        doc.head.appendChild(styleEl);

        cards.forEach((card, index) => {
            const cardEl = doc.createElement('div');
            cardEl.className = 'card';

            const header = doc.createElement('div');
            header.className = 'card-header';
            header.innerHTML = `<span>BINGO 90</span><span>ID: ${card.id}</span>`;
            cardEl.appendChild(header);

            const grid = doc.createElement('div');
            grid.className = 'grid';
            card.matrix.flat().forEach(num => {
                const cell = doc.createElement('div');
                cell.className = num === 0 ? 'cell empty' : 'cell';
                cell.textContent = num || '';
                grid.appendChild(cell);
            });
            cardEl.appendChild(grid);

            doc.body.appendChild(cardEl);

            if ((index + 1) % 3 === 0 && index !== cards.length - 1) {
                const breakEl = doc.createElement('div');
                breakEl.className = 'page-break';
                doc.body.appendChild(breakEl);
            }
        });

        const script = doc.createElement('script');
        script.textContent = 'window.onload = () => window.print();';
        doc.body.appendChild(script);
        doc.close();
    }

    /**
     * Imprime cartones agrupados por jugador con estilo visual consistente
     * @param {Array} players Array de jugadores con sus cartones
     */
    printPlayerCards(players) {
        if (!players || players.length === 0) {
            alert("No hay jugadores con cartones para imprimir.");
            return;
        }

        const printWindow = window.open('', '_blank');
        if (!printWindow) {
            alert("Por favor habilita los popups para imprimir cartones.");
            return;
        }

        const doc = printWindow.document;
        doc.open();
        doc.write(`
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Cartones de Bingo</title>
    <link href="https://fonts.googleapis.com/css2?family=Dela+Gothic+One&family=Space+Mono:wght@400;700&display=swap" rel="stylesheet">
    <style>
        @media print {
            @page { size: A4; margin: 0.8cm; }
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            .no-print { display: none !important; }
        }
        
        * { box-sizing: border-box; margin: 0; padding: 0; }
        
        body {
            font-family: 'Space Mono', monospace;
            background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
            color: #fff;
            min-height: 100vh;
            padding: 20px;
        }
        
        .header {
            text-align: center;
            margin-bottom: 30px;
            padding: 20px;
        }
        
        .header h1 {
            font-family: 'Dela Gothic One', cursive;
            font-size: 2.5rem;
            background: linear-gradient(135deg, #ff6b35, #f7c531);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            margin-bottom: 10px;
        }
        
        .header p {
            color: rgba(255,255,255,0.6);
            font-size: 0.9rem;
        }
        
        .player-section {
            background: rgba(255,255,255,0.05);
            border: 1px solid rgba(255,255,255,0.1);
            border-radius: 12px;
            margin-bottom: 30px;
            padding: 20px;
            page-break-inside: avoid;
        }
        
        .player-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 2px solid rgba(255,255,255,0.2);
            padding-bottom: 15px;
            margin-bottom: 20px;
        }
        
        .player-name {
            font-family: 'Dela Gothic One', cursive;
            font-size: 1.5rem;
            color: #f7c531;
        }
        
        .player-badge {
            background: rgba(255,107,53,0.2);
            border: 1px solid #ff6b35;
            padding: 5px 15px;
            border-radius: 20px;
            font-size: 0.8rem;
            color: #ff6b35;
        }
        
        .cards-container {
            display: flex;
            flex-wrap: wrap;
            gap: 20px;
            justify-content: center;
        }
        
        .bingo-card {
            background: linear-gradient(145deg, #2a2a4a, #1e1e3a);
            border: 2px solid rgba(255,255,255,0.2);
            border-radius: 10px;
            padding: 15px;
            width: 320px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.3);
        }
        
        .card-header {
            display: flex;
            justify-content: space-between;
            margin-bottom: 10px;
            font-size: 0.7rem;
            color: rgba(255,255,255,0.5);
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        
        .card-grid {
            display: grid;
            grid-template-columns: repeat(9, 1fr);
            gap: 3px;
        }
        
        .cell {
            aspect-ratio: 1;
            display: flex;
            align-items: center;
            justify-content: center;
            font-family: 'Dela Gothic One', cursive;
            font-size: 0.9rem;
            border-radius: 50%;
            background: rgba(255,255,255,0.1);
            color: #fff;
            min-width: 28px;
            min-height: 28px;
        }
        
        .cell.has-number {
            background: linear-gradient(145deg, #ff6b35, #e55a2b);
            box-shadow: 0 3px 8px rgba(255,107,53,0.3);
            font-weight: bold;
        }
        
        .cell.empty {
            background: rgba(0,0,0,0.2);
            border: 1px dashed rgba(255,255,255,0.1);
        }
        
        .print-btn {
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: linear-gradient(135deg, #ff6b35, #e55a2b);
            color: white;
            border: none;
            padding: 15px 30px;
            font-family: 'Space Mono', monospace;
            font-size: 1rem;
            font-weight: bold;
            border-radius: 50px;
            cursor: pointer;
            box-shadow: 0 5px 20px rgba(255,107,53,0.4);
            transition: all 0.3s;
            z-index: 1000;
        }
        
        .print-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(255,107,53,0.5);
        }
        
        .footer {
            text-align: center;
            margin-top: 30px;
            padding: 20px;
            color: rgba(255,255,255,0.4);
            font-size: 0.8rem;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>🎱 BinGoo!</h1>
        <p>Cartones de Bingo · ${new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
    </div>
`);

        players.forEach((player, playerIdx) => {
            doc.write(`
    <div class="player-section">
        <div class="player-header">
            <span class="player-name">${player.name}</span>
            <span class="player-badge">${player.cards.length} cartón${player.cards.length > 1 ? 'es' : ''}</span>
        </div>
        <div class="cards-container">
`);
            
            player.cards.forEach((card, cardIdx) => {
                doc.write(`
            <div class="bingo-card">
                <div class="card-header">
                    <span>Cartón ${cardIdx + 1}</span>
                    <span>ID: ${card.id}</span>
                </div>
                <div class="card-grid">
`);
                card.matrix.flat().forEach(num => {
                    const cellClass = num === 0 ? 'cell empty' : 'cell has-number';
                    doc.write(`<div class="${cellClass}">${num || ''}</div>`);
                });
                
                doc.write(`
                </div>
            </div>
`);
            });
            
            doc.write(`
        </div>
    </div>
`);
        });

        doc.write(`
    <div class="footer">
        <p>Generado por BinGoo! · ¡Buena suerte a todos!</p>
    </div>
    
    <button class="print-btn no-print" onclick="window.print()">🖨️ IMPRIMIR</button>
</body>
</html>
`);
        doc.close();
    }

    // --- MÉTODOS PRIVADOS ---

    _generateColumnCounts() {
        // Reglas: Suma total 15. Length 9. Min 1. Max 3.
        const counts = new Array(9).fill(1); // Mínimo 1 por columna
        let remaining = 15 - 9; // 6 para distribuir

        while (remaining > 0) {
            const colIndex = Math.floor(Math.random() * 9);
            if (counts[colIndex] < 3) {
                counts[colIndex]++;
                remaining--;
            }
        }
        return counts;
    }

    _generateColumnNumbers(counts) {
        // Rangos estándar Bingo 90
        // Col 0: 1-9, Col 1: 10-19... Col 8: 80-90
        const numbers = [];
        
        for (let c = 0; c < 9; c++) {
            let start = c * 10;
            let end = (c * 10) + 9;
            if (c === 0) start = 1;
            if (c === 8) end = 90;

            const colNums = [];
            while (colNums.length < counts[c]) {
                const num = Math.floor(Math.random() * (end - start + 1)) + start;
                if (!colNums.includes(num)) {
                    colNums.push(num);
                }
            }
            // Ordenar ascendentemente en la columna
            colNums.sort((a, b) => a - b);
            numbers.push(colNums);
        }
        return numbers;
    }

    _generateLayout(colCounts) {
        // Necesitamos asignar posiciones en 3 filas tal que:
        // cada columna 'c' tenga 'colCounts[c]' celdas ocupadas
        // cada fila 'r' tenga exactamente 5 celdas ocupadas
        // Total sum checks out: 15.

        const grid = new Array(3).fill(null).map(() => new Array(9).fill(0));
        const rowCounts = [0, 0, 0];

        // Estrategia: Ordenar columnas por restricción (mayor cantidad primero) facilita la asignación?
        // O aleatorizar para variedad. Aleatorizar mejor.
        
        // Pero primero debemos satisfacer las columnas de 3 (ocupan las 3 filas si o si)
        for (let c = 0; c < 9; c++) {
            if (colCounts[c] === 3) {
                grid[0][c] = 1;
                grid[1][c] = 1;
                grid[2][c] = 1;
                rowCounts[0]++;
                rowCounts[1]++;
                rowCounts[2]++;
            }
        }

        // Columnas de 2 y 1 son las problemáticas para balancear filas a 5.
        // Hacemos backtracking simple o shuffle retry sobre las columnas restantes.
        const remainingCols = [];
        for (let c = 0; c < 9; c++) {
            if (colCounts[c] !== 3) {
                remainingCols.push({ idx: c, count: colCounts[c] });
            }
        }

        // Shuffle remaining cols para variedad
        for (let i = remainingCols.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [remainingCols[i], remainingCols[j]] = [remainingCols[j], remainingCols[i]];
        }

        if (this._solveLayout(grid, rowCounts, remainingCols, 0)) {
            return grid;
        } else {
            throw new Error("Layout imposible");
        }
    }

    /**
     * Backtracking recursivo para asignar filas a las columnas restantes
     */
    _solveLayout(grid, rowCounts, cols, colIndex) {
        if (colIndex >= cols.length) {
            return rowCounts[0] === 5 && rowCounts[1] === 5 && rowCounts[2] === 5;
        }

        const { idx: c, count } = cols[colIndex];
        const combinations = this._getShuffledCombinations(count);

        for (const rowsIdx of combinations) {
            if (this._isValidMove(rowCounts, rowsIdx)) {
                this._applyMove(grid, rowCounts, rowsIdx, c, 1);

                if (this._solveLayout(grid, rowCounts, cols, colIndex + 1)) {
                    return true;
                }

                // Backtrack
                this._applyMove(grid, rowCounts, rowsIdx, c, 0);
            }
        }

        return false;
    }

    _getShuffledCombinations(count) {
        let combinations = [];
        if (count === 1) {
            combinations = [[0], [1], [2]];
        } else if (count === 2) {
            combinations = [[0, 1], [0, 2], [1, 2]];
        }
        return combinations.sort(() => Math.random() - 0.5);
    }

    _isValidMove(rowCounts, rowsIdx) {
        return rowsIdx.every(r => rowCounts[r] < 5);
    }

    _applyMove(grid, rowCounts, rowsIdx, c, val) {
        const increment = val === 1 ? 1 : -1;
        rowsIdx.forEach(r => {
            grid[r][c] = val;
            rowCounts[r] += increment;
        });
    }

    _fillMatrix(layout, colNumbers) {
        const matrix = new Array(3).fill(null).map(() => new Array(9).fill(0));
        
        // Copiamos para no mutar el original
        const colNumsCopy = colNumbers.map(arr => [...arr]);

        for (let c = 0; c < 9; c++) {
            // Extraer números para esta columna
            const nums = colNumsCopy[c];
            // Llenar de arriba a abajo donde layout sea 1
            let numIdx = 0;
            for (let r = 0; r < 3; r++) {
                if (layout[r][c] === 1) {
                    if (numIdx < nums.length) {
                        matrix[r][c] = nums[numIdx];
                        numIdx++;
                    }
                }
            }
        }
        return matrix;
    }

    _generateHash(matrix) {
        // Simple hash basado en el contenido
        const str = matrix.flat().join(',');
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const code = str.codePointAt(i);
            hash = Math.imul(hash, 31) + code;
            hash = Math.trunc(hash);
        }
        // Convertir a hex string positivo y añadir padding y timestamp para unicidad real si se generan seguidos
        return Math.abs(hash).toString(16).toUpperCase().padStart(8, '0') + "-" + Date.now().toString(36).slice(-4).toUpperCase();
    }
}
