import './App.css';
import { WalletMultiButton,  } from "@solana/wallet-adapter-react-ui";
import CreateNFT from "./createNFT/createNFT"
require('@solana/wallet-adapter-react-ui/styles.css');

function App() {
  return (
    <div className="App">
      <WalletMultiButton />
      <CreateNFT />
    </div>
  );
}

export default App;
