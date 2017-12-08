const INIT = 0b00000001;
const SET = 0b00000010;
const SAVE = 0b00000100;
const MUL = 0b00000101;
const PRN = 0b00000110;
const HALT = 0b00000000;
const ADD = 0b00001100; // ADD R R
const PUSH = 0b00001010; // Push
const POP = 0b00001011; //Pop
const LD = 0b00001000;  // Load M(emory)
const ST = 0b00001001; // Store M(emory)

const JMP = 0b00010001; //JMP
const JEQ = 0b00010011; //JEQ
const JNE = 0b00010100; //JNE
const CMP = 0b00010110; //CMP R

const SP = 0xff; // stack pointer is register 255


class CPU {
    constructor() {
        this.mem = new Array(256);
        this.mem.fill(0);
        
        this.curReg = 0;
        this.reg = new Array(256);
        this.reg.fill(0);

        this.reg.PC = 0;
        this.reg[SP] = 0;

        this.flags = {
            equal: false
        };

        this.reg.MAR = 0; // Memory Address Register
        this.reg.MDR = 0; // Memory Data Register

        this.buildBranchTable();
    }

    /**
     * Build the branch table
     */
    buildBranchTable() {
        this.branchTable = {
            [INIT]: this.INIT,
            [SET]: this.SET,
            [SAVE]: this.SAVE,
            [MUL]: this.MUL,
            [PRN]: this.PRN,
            [HALT]: this.HALT,
            [ADD]: this.ADD,
            [PUSH]: this.PUSH,
            [POP]: this.POP,
            [LD]: this.LD,
            [ST]: this.ST,
            [JMP]: this.JMP,
            [JEQ]: this.JEQ
        };
    }
    
    /*
    ** Poke values into memory
    */
    poke(address, value) {
        this.mem[address] = value;
    }

    /*
    ** start the clock
    */
    startClock() {
        this.clock = setInterval(() => { this.tick(); }, 1);
    }

    /*
    * Stop the clock
    */
    stopClock() {
        clearInterval(this.clock);
    }

    /**
     * loadMem
     */
    loadMem() {
        this.reg.MDR = this.mem[this.reg.MAR];
    }

    /**
     * loadMem
     */
    storeMem() {
        this.mem[this.reg.MAR] = this.reg.MDR;
    }

    /**
     * Each tick of the clock
     */
    tick() {
        // Run the instructions
        // const currentInstruction = this.mem[this.reg.PC];
        this.reg.MAR = this.reg.PC;
        this.loadMem();
        const currentInstruction =  this.reg.MDR;

        const handler = this.branchTable[currentInstruction];

        if (handler === undefined) {
            console.error("ERROR: invalid instruction " + currentInstruction);
            this.stopClock();
            return;
        }

        handler.call(this); // set this explicitly in handler
    }

    /**
     * ALU
     */
    alu(func, reg0, reg1) {
        let regVal0, regVal1;

        switch (func) {
            case 'MUL': 
                regVal0 = this.reg[reg0];
                regVal1 = this.reg[reg1];
                
                return regVal0 * regVal1;
            
            case 'ADD':
                regVal0 = this.reg[reg0];
                regVal1 = this.reg[reg1];
                
                return regVal0 + regVal1;
            
            case 'INC':
                this.reg[reg0]++;

                if (this.reg[reg0] > 255) {
                    this.reg[reg0] = 0;
                }
                break;

            case 'DEC':
                this.reg[reg0]--;
                
                if (this.reg[reg0] < 0) {
                    this.reg[reg0] = 255;
                }
                break;

            case 'CMP':
                regVal0 = this.reg[reg0];
                regVal1 = this.reg[reg1];

                this.flags.equal = (regVal0 === regVal1);
                break;
        }
    }


    /*
    * Handle INIT
    */
    INIT() {
        console.log("INIT");
        this.curReg = 0;

        // this.reg.PC++; // go to next instruction
        this.alu('INC', 'PC');
    }

    /**
     * Handle SET
     */
    SET() {
        const reg = this.mem[this.reg.PC + 1];
        console.log("SET " + reg);

        this.curReg = reg;

        // this.reg.PC += 2; // go to next instruction
        this.alu('INC', 'PC');
        this.alu('INC', 'PC');
    }
    /**
     * Handle SAVE
     */
    SAVE() {
        const val = this.mem[this.reg.PC + 1];
        console.log("SAVE " + val);
        
        // Store the value in the current register
        this.reg[this.curReg] = val;

        this.reg.PC += 2; // go to next instruction
    }

    /**
     * MULtiply
     */
    MUL() {
        const reg0 = this.mem[this.reg.PC + 1];
        const reg1 = this.mem[this.reg.PC + 2];

        console.log("MUL" + reg0 + " " + reg1);

        const regVal0 = this.reg[reg0];
        const regVal1 = this.reg[reg1];

        this.reg[this.curReg] = this.alu('MUL', reg0, reg1);

        this.reg.PC += 3; // go to next instruction
    }

    /**
     * ADD
     */
    ADD() {
        const reg0 = this.mem[this.reg.PC + 1];
        const reg1 = this.mem[this.reg.PC + 2];

        console.log("ADD" + reg0 + " " + reg1);

        const regVal0 = this.reg[reg0];
        const regVal1 = this.reg[reg1];

        this.reg[this.curReg] = regVal0 + regVal1;

        this.reg.PC += 3; // go to next instruction
    }

    /**
     * PRN
     */

    PRN() {
         console.log("PRN");

         console.log(this.reg[this.curReg]);
         
         this.reg.PC++;
     }

    /**
     * HALT
     */
    HALT() {
        this.stopClock();
    }

    /**
     * PUSH
     */
    PUSH() {
        console.log('PUSH');

        // decrement sp
        this.alu('DEC', SP);

        // store current reg at the sp
        this.mem[this.reg[SP]] = this.reg[this.curReg];
    }

    /**
     * POP
     */
    POP() {
        console.log('POP');

        // store current reg at the sp
        this.reg[this.curReg] = this.mem[this.reg[SP]];
        
        // increment sp
        this.alu('INC', SP);
    }

    /**
     *  Load
     */
    LD() {
        console.log("LD");

        this.reg.MAR = this.reg.PC + 1;
        loadMem();
        const address = this.reg.MDR;

        this.reg.MAR = address;
        loadMem();
        this.reg[this.curReg] = this.reg.MAR;

        this.alu('INC', 'PC');
        this.alu('INC', 'PC');
    }

    /**
     *  Store
     */
    ST() {
        console.log("ST");

        const address = this.mem[this.reg.PC + 1];

        this.mem[address] = this.reg[this.curReg];

        this.alu('INC', 'PC');
        this.alu('INC', 'PC');
    }

    /**
     * JMP unconditional
     */
    JMP() {

        /**
        00010001 JMP < PC
        00001110 14 < PC + 1
         */

        this.reg.MAR = this.reg.PC + 1;
        loadMem();
        this.reg.PC = this.reg.MDR;
    }

    /**
     * CMP compare
     */

    CMP() {
        this.reg.MAR = this.reg.PC + 1;
        loadMem();
        this.reg0 = this.reg.MDR;

        this.alu('CMP', this.curReg, this.reg.MDR);

        this.alu('INC', 'PC');
        this.alu('INC', 'PC');
    }
    /**
     * JEQ Jump if equal
     */
    JEQ() {
        if (this.flags.equal) {
            this.reg.MAR = this.reg.PC + 1;
            loadMem();
            this.reg.PC = this.reg.MDR;
        } else {
            this.alu('INC', 'PC');
            this.alu('INC', 'PC');
        }
    }
}

module.exports = CPU;