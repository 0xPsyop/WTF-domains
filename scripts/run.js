
require("dotenv").config({ path: ".env" });
require("@nomiclabs/hardhat-etherscan");

const main = async()=>{
    const domainContractFactory = await hre.ethers.getContractFactory('Domains');
    const domainContract = await domainContractFactory.deploy("wtf");
    await domainContract.deployed();

    console.log("Contract deployed to:", domainContract.address);

    
    console.log("verifying...")
   await pending(60000);

   await hre.run("verify:verify", {
    address: domainContract.address,
    constructorArguments: ["wtf"],
  });

}

function pending(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

    const runMain = async()=> {

        try{
          await main();
          process.exit(0);
        }catch(err){
        console.log(err)
          process.exit(1);
        }
    }

runMain();