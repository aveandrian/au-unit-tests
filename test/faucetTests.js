const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');
const { expect } = require('chai');
const { ethers } = require('hardhat');

describe("Faucet", ()=>{
    // We define a fixture to reuse the same setup in every test.
    // We use loadFixture to run this setup once, snapshot that state,
    // and reset Hardhat Network to that snapshot in every test.
    async function deployContractAndSetVariables(){
        const Faucet = await ethers.getContractFactory("Faucet");
        const faucet = await Faucet.deploy({ value: ethers.utils.parseEther("5") });

        const [owner, addr1, addr2 ] = await ethers.getSigners();

        const balance = await ethers.provider.getBalance(faucet.address); 
        return {faucet, owner, addr1, addr2}
    }

    it("should deploy and set the owner correctly", async()=>{
        const {faucet, owner} =  await loadFixture(deployContractAndSetVariables);

        expect(await faucet.owner()).to.equal(owner.address);
    })
    
    it("should not allow withdrawals above .1 at a time", async()=>{
        const {faucet} = await loadFixture(deployContractAndSetVariables);
        let withdrawAmount = ethers.utils.parseUnits(".2", "ether");

        await expect(faucet.withdraw(withdrawAmount)).to.be.revertedWith("You can only withdraw <= .1 ETH at a time");
    })

    it("should be destroyed when destroyFaucet is called", async()=>{
        const {faucet, owner} = await loadFixture(deployContractAndSetVariables);
        let address = faucet.address;
        await faucet.destroyFaucet()
        expect(await ethers.provider.getCode(address)).eq('0x');
    })

    it("check onlyOwner functions", async()=>{
        const {faucet, addr1, addr2} = await loadFixture(deployContractAndSetVariables);
        
        await expect(faucet.connect(addr1).withdrawAll()).to.be.revertedWith("Only the owner can call this function");
        await expect(faucet.connect(addr2).destroyFaucet()).to.be.revertedWith("Only the owner can call this function");
    })

    it("should withdraw ETH to sender's address", async()=>{
        const {faucet, owner, addr1} = await loadFixture(deployContractAndSetVariables);

        let startBalance = await ethers.provider.getBalance(addr1.address);
        let withdrawAmount = ethers.utils.parseEther('0.05');

        let tx = await faucet.connect(addr1).withdraw(withdrawAmount)
        let receipt = await tx.wait();
        let gas = receipt.effectiveGasPrice * receipt.gasUsed;

        let lastBalance = await ethers.provider.getBalance(addr1.address);

        let balanceAfterGas = parseFloat(startBalance) + parseFloat(withdrawAmount) - parseFloat(gas);

        expect(balanceAfterGas).eq(parseFloat(lastBalance))
    })

    
    it("should withdraw all ETH to owner address", async()=>{
        const {faucet, owner, addr1} = await loadFixture(deployContractAndSetVariables);

        let startBalance = await ethers.provider.getBalance(owner.address);
        let withdrawAmount = await ethers.provider.getBalance(faucet.address);
    
        let tx = await faucet.withdrawAll()
        let receipt = await tx.wait();
        let gas = receipt.effectiveGasPrice * receipt.gasUsed;

        let lastBalance = await ethers.provider.getBalance(owner.address);

        let balanceAfterGas = parseFloat(startBalance) + parseFloat(withdrawAmount) - parseFloat(gas);

        
        expect(await ethers.provider.getBalance(faucet.address)).eq(0)
        expect(parseFloat(balanceAfterGas)).eq(parseFloat(lastBalance))
    })
})