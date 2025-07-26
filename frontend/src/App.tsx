import { useState } from 'react';
import styled, { keyframes, createGlobalStyle } from 'styled-components';
import OdinLogoV from './assets/odin-logo-v.svg';
import OdinLogoH from './assets/odin-logo-h.svg';
import ExpandArrow from './assets/expand-arrow.svg';
import MassaLogo from './assets/massa-logo.jpeg';
import { connectWithPrivateKey, disconnectWallet } from './utils/massaWallet';
import type { WalletState } from './types';

const GlobalStyle = createGlobalStyle`
  html, body, #root {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
    background: #0A1226;
    min-height: 100vh;
    width: 100vw;
  }
`;

const fadeInStretch = keyframes`
  0% {
    opacity: 0;
    letter-spacing: 10px;
  }
  60% {
    opacity: 1;
    letter-spacing: 10px;
  }
  100% {
    opacity: 1;
    letter-spacing: 20px;
  }
`;

const logoFadeInUp = keyframes`
  0% {
    opacity: 0;
    transform: translateY(20px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
`;

const loginFadeInUp = keyframes`
  0% {
    opacity: 0;
    transform: translateY(20px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
`;

const homepageFadeIn = keyframes`
  0% {
    opacity: 0;
    transform: translateY(30px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
`;

const headerSlideIn = keyframes`
  0% {
    opacity: 0;
    transform: translateY(-20px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
`;

const contentFadeIn = keyframes`
  0% {
    opacity: 0;
    transform: translateY(40px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
`;

const PageContainer = styled.div`
  min-height: 100vh;
  width: 100vw;
  background: #0A1226;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
`;

const LogoImg = styled.img`
  width: 600px;
  max-width: 90vw;
  height: auto;
  display: block;
  margin-bottom: 0px;
  opacity: 0;
  animation: ${logoFadeInUp} 1.5s cubic-bezier(0.4,0,0.2,1) 0.1s forwards;
  @media (max-width: 600px) {
    width: 660px;
    margin-bottom: 28px;
  }
`;

const gradientMove = keyframes`
  0% {
    background-position: 200% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
`;



const breathe = keyframes`
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.02);
  }
`;

const Slogan = styled.div`
  font-size: 1.5rem;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  font-weight: 800;
  text-transform: uppercase;
  text-align: center;
  opacity: 0;
  letter-spacing: 0px;
  background: linear-gradient(90deg, #00F5FF 0%, #FFD700 50%, #00F5FF 100%);
  background-size: 200% 200%;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  color: transparent;
  animation:
    ${fadeInStretch} 1.4s cubic-bezier(0.4,0,0.2,1) 0.1s forwards,
    ${gradientMove} 3.5s linear 1.27s infinite,
    ${breathe} 4s ease-in-out infinite;
  margin-bottom: 30px;
  @media (max-width: 600px) {
    font-size: 1.5rem;
  }
`;

const SloganUnderline = styled.div`
  width: 80px;
  height: 5px;
  background: #FFD700;
  border-radius: 3px;
  margin: 0 auto 0 auto;
  margin-bottom: 20px;
  opacity: 0;
  animation: ${logoFadeInUp} 1.5s cubic-bezier(0.4,0,0.2,1) 0.1s forwards;
`;

const LoginButton = styled.button<{ variant?: 'google' | 'email' | 'wallet' }>`
  width: 280px;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 14px;
  padding: 14px 0;
  border-radius: 8px;
  font-size: 1.08rem;
  font-family: 'Inter', sans-serif;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.18s, color 0.18s, box-shadow 0.18s, border 0.18s;
  box-shadow: 0 2px 12px #00F5FF22;
  color: ${({ variant }) =>
    variant === 'google' || variant === 'wallet' ? '#00F5FF' : '#0A1226'};
  background: ${({ variant }) =>
    variant === 'google' || variant === 'wallet' ? 'transparent' :
    variant === 'email' ? '#00F5FF' :
    '#00F5FF'};
  border: ${({ variant }) =>
    variant === 'google' || variant === 'wallet' ? '2px solid #00F5FF' : 'none'};
  font-weight: 700;
  opacity: 0;
  animation: ${logoFadeInUp} 1.5s cubic-bezier(0.4,0,0.2,1) 0.1s forwards;
  &:hover, &:focus {
    background: ${({ variant }) =>
      variant === 'google' || variant === 'wallet' ? '#00F5FF' :
      variant === 'email' ? '#00e0e0' :
      '#00e0e0'};
    color: ${({ variant }) =>
      variant === 'google' || variant === 'wallet' ? '#0A1226' : '#0A1226'};
    box-shadow: 0 4px 18px #FFD70055;
    border: ${({ variant }) =>
      variant === 'google' || variant === 'wallet' ? '2px solid #00F5FF' : 'none'};
  }
`;

const LoginIcon = styled.span<{ variant?: 'google' }>`
  display: flex;
  align-items: center;
  font-size: 1.3em;
  color: ${({ variant }) => (variant === 'google' ? '#00F5FF' : 'inherit')};
  transition: color 0.18s;
  svg {
    transition: color 0.18s, fill 0.18s;
    fill: currentColor;
  }
  ${LoginButton}:hover & {
    color: ${({ variant }) => (variant === 'google' ? '#0A1226' : 'inherit')};
  }
`;

const OrDivider = styled.div`
  width: 100%;
  display: flex;
  align-items: center;
  margin: 18px 0 18px 0;
  color: #aaa;
  font-size: 1rem;
  font-family: 'Inter', sans-serif;
  font-weight: 500;
  gap: 10px;
  user-select: none;
  &::before, &::after {
    content: '';
    flex: 1;
    height: 1.5px;
    background: #232b4a;
  }
`;

const ModalBackdrop = styled.div`
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(10, 18, 38, 0.75);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const ModalPanel = styled.div`
  background: #181f36;
  border-radius: 16px;
  box-shadow: 0 8px 32px #0008;
  padding: 28px 48px 56px 48px;
  width: 520px;
  min-width: 520px;
  height: 600px;
  max-width: 95vw;
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  animation: ${loginFadeInUp} 0.5s cubic-bezier(0.4,0,0.2,1);
  overflow-y: auto;
`;

const CloseButton = styled.button`
  position: absolute;
  top: 16px;
  right: 16px;
  background: none;
  border: none;
  color: #aaa;
  font-size: 1.3rem;
  font-family: 'Inter', sans-serif;
  font-weight: 400;
  cursor: pointer;
  padding: 6px 18px;
  line-height: 1;
  letter-spacing: 0.02em;
  transition: color 0.18s;
  &:hover {
    color: #fff;
  }
`;

const TabsContainer = styled.div`
  display: flex;
  width: 100%;
  border-bottom: 1.5px solid #232b4a;
  margin-bottom: 28px;
  margin-top: 28px;
`;

const Tab = styled.button<{ active?: boolean }>`
  flex: 1;
  background: none;
  border: none;
  outline: none;
  font-family: 'Inter', sans-serif;
  font-size: 1.1rem;
  font-weight: 700;
  color: ${({ active }) => (active ? '#00F5FF' : '#fff')};
  border-bottom: 3px solid ${({ active }) => (active ? '#00F5FF' : 'transparent')};
  padding: 16px 0 10px 0;
  cursor: pointer;
  transition: color 0.18s, border-bottom 0.18s;
`;

const EmailInput = styled.input`
  width: 100%;
  box-sizing: border-box;
  display: block;
  padding: 12px 14px;
  border-radius: 7px;
  border: 1.5px solid #232b4a;
  background: #2a3450;
  color: #fff;
  font-size: 1rem;
  margin-bottom: 16px;
  font-family: 'Inter', sans-serif;
  outline: none;
  transition: border 0.18s;
  &:focus {
    border: 1.5px solid #00F5FF;
  }
`;

const PasswordInput = styled(EmailInput).attrs({ type: 'password' })``;

const FormLoginButton = styled.button`
  width: 100%;
  box-sizing: border-box;
  display: block;
  margin: 18px auto 0 auto;
  background: #00F5FF;
  color: #0A1226;
  border: none;
  border-radius: 8px;
  padding: 14px 0;
  font-size: 1.08rem;
  font-family: 'Inter', sans-serif;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.18s, color 0.18s, box-shadow 0.18s;
  box-shadow: 0 2px 12px #00F5FF22;
  &:hover, &:focus {
    background: #00e0e0;
    color: #0A1226;
    box-shadow: 0 4px 18px #FFD70055;
  }
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const ForgotLink = styled.a`
  color: #00F5FF;
  font-size: 0.98rem;
  text-decoration: none;
  margin-bottom: 18px;
  display: block;
  text-align: right;
  cursor: pointer;
  width: 100%;
  &:hover {
    text-decoration: underline;
  }
`;

const SlidingTabsContainer = styled.div<{ activeTab: 'login' | 'wallet' }>`
  width: 100%;
  min-height: 340px;
  overflow: hidden;
  position: relative;
`;

const SlidingTabsInner = styled.div<{ activeTab: 'login' | 'wallet' }>`
  display: flex;
  width: 200%;
  transition: transform 0.35s cubic-bezier(0.4,0,0.2,1);
  transform: translateX(${({ activeTab }) => (activeTab === 'wallet' ? '0%' : '-50%')});
`;

const SlidingTabContent = styled.div`
  width: 50%;
  min-width: 50%;
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const LoginTabContent = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  margin-top: 32px;
  position: relative;
`;

const ComingSoonOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(10, 18, 38, 0.6);
  backdrop-filter: blur(1px);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  z-index: 10;
`;

// Homepage Components
const HomepageContainer = styled.div`
  min-height: 100vh;
  width: 100vw;
  background: #0A1226;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  display: flex;
  flex-direction: column;
  animation: ${homepageFadeIn} 0.8s cubic-bezier(0.4,0,0.2,1);
`;

const Header = styled.header`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 40px;
  background: rgba(24, 31, 54, 0.8);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid #232b4a;
  animation: ${headerSlideIn} 0.6s cubic-bezier(0.4,0,0.2,1) 0.2s both;
`;

const HeaderLogo = styled.img`
  height: 40px;
  width: auto;
`;

const HeaderWalletInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  color: #fff;
`;

const WalletBalance = styled.div`
  background: #00F5FF;
  color: #0A1226;
  padding: 8px 16px;
  border-radius: 20px;
  font-weight: 600;
  font-size: 0.9rem;
`;

const DisconnectButton = styled.button`
  background: none;
  border: 1px solid #232b4a;
  color: #aaa;
  padding: 8px 16px;
  border-radius: 8px;
  cursor: pointer;
  font-family: 'Inter', sans-serif;
  font-size: 0.9rem;
  transition: all 0.2s;
  
  &:hover {
    border-color: #FFD700;
    color: #FFD700;
  }
`;

const MainContent = styled.main`
  flex: 1;
  padding: 40px;
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
  animation: ${contentFadeIn} 0.8s cubic-bezier(0.4,0,0.2,1) 0.4s both;
`;

const SectionTitle = styled.h2`
  color: #fff;
  font-size: 1.5rem;
  font-weight: 700;
  margin-bottom: 24px;
  display: flex;
  align-items: center;
  gap: 12px;
`;

const SectionIcon = styled.div`
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #00F5FF;
`;

const GridContainer = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 40px;
  margin-bottom: 40px;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 24px;
  }
`;

const SectionCard = styled.div<{ delay?: number }>`
  background: #181f36;
  border: 1px solid #232b4a;
  border-radius: 16px;
  padding: 24px;
  min-height: 300px;
  animation: ${contentFadeIn} 0.8s cubic-bezier(0.4,0,0.2,1) ${({ delay = 0 }) => 0.6 + delay * 0.1}s both;
`;



const WalletSummary = styled.div`
  background: #20294a;
  border: 1px solid #232b4a;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 16px;
`;

const CoinBalance = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #232b4a;
  
  &:last-child {
    border-bottom: none;
  }
`;

const CoinInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const CoinIcon = styled.div<{ $isImage?: boolean }>`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 0.9rem;
  overflow: hidden;
  
  ${({ $isImage }) => $isImage && `
    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  `}
`;

const CoinDetails = styled.div``;

const CoinName = styled.div`
  color: #fff;
  font-weight: 600;
  font-size: 1rem;
`;

const CoinSymbol = styled.div`
  color: #aaa;
  font-size: 0.8rem;
`;

const CoinAmount = styled.div`
  color: #fff;
  font-weight: 600;
  font-size: 1rem;
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #aaa;
  text-align: center;
  padding: 40px 20px;
`;

const EmptyStateIcon = styled.div`
  font-size: 3rem;
  margin-bottom: 16px;
  opacity: 0.5;
`;

const EmptyStateText = styled.div`
  font-size: 1rem;
  margin-bottom: 8px;
`;

const EmptyStateSubtext = styled.div`
  font-size: 0.9rem;
  opacity: 0.7;
`;

const DisconnectMessage = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  background: #1a2337;
  color: #fff;
  padding: 12px 0;
  text-align: center;
  font-weight: 600;
  font-size: 0.9rem;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  z-index: 2000;
`;



// WalletsList and WalletOption styles for Connect Wallets tab
const WalletsList = styled.div`
  width: 100%;
  margin: 32px auto 0 auto;
  display: flex;
  flex-direction: column;
  gap: 18px;
`;

const WalletOption = styled.button`
  display: flex;
  align-items: center;
  width: 100%;
  background: #20294a;
  border: 2px solid #232b4a;
  border-radius: 12px;
  padding: 18px 20px;
  cursor: pointer;
  transition: border 0.18s, background 0.18s, box-shadow 0.18s;
  box-shadow: 0 2px 12px #00F5FF11;
  &:hover, &:focus {
    border: 2px solid #00F5FF;
    background: #232b4a;
    box-shadow: 0 4px 18px #00F5FF33;
  }
`;

const WalletIcon = styled.div`
  width: 38px;
  height: 38px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 18px;
`;

const WalletInfo = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
`;

const WalletName = styled.div`
  color: #fff;
  font-size: 1.08rem;
  font-weight: 700;
  margin-bottom: 2px;
`;

const WalletDesc = styled.div`
  color: #aaa;
  font-size: 0.98rem;
`;

const WalletArrow = styled.div`
  color: #00F5FF;
  font-size: 1.3rem;
  margin-left: 12px;
  font-weight: 700;
`;

// Helper for accordion input container
const AccordionInputContainer = styled.div`
  width: 100%;
  background: #20294a;
  border-radius: 0 0 10px 10px;
  margin-top: 18px;
  padding: 18px 0 10px 0;
  display: flex;
  flex-direction: column;
  align-items: center;
`;

function App() {
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'login' | 'wallet'>('wallet');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // Wallet state
  const [walletState, setWalletState] = useState<WalletState>({
    provider: null,
    wallet: null,
    balance: '0',
    isConnected: false,
    isLoading: false,
    error: null
  });
  
  const [showMassaInput, setShowMassaInput] = useState(false);
  const [showLedgerInput, setShowLedgerInput] = useState(false);
  const [inputPrivateKey, setInputPrivateKey] = useState('');
  const [inputError, setInputError] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  
  // Homepage state
  const [showHomepage, setShowHomepage] = useState(false);
  const [showDisconnectMessage, setShowDisconnectMessage] = useState(false);

  const handleOpenModal = () => setShowModal(true);
  const handleCloseModal = () => {
    setShowModal(false);
    setActiveTab('wallet');
    setEmail('');
    setPassword('');
    setWalletState(prev => ({ ...prev, error: null }));
    setShowMassaInput(false);
    setShowLedgerInput(false);
    setInputPrivateKey('');
    setInputError('');
  };

  // Handler for Massa Wallet connect (toggle accordion)
  const handleConnectMassaWallet = () => {
    setShowMassaInput((prev) => !prev);
    setInputError('');
  };

  // Handler for Ledger Wallet connect (toggle accordion)
  const handleConnectLedgerWallet = () => {
    setShowLedgerInput((prev) => !prev);
  };



  // Handler for disconnecting wallet
  const handleDisconnectWallet = async () => {
    if (walletState.wallet) {
      await disconnectWallet(walletState.wallet);
    }
    
    setWalletState({
      provider: null,
      wallet: null,
      balance: '0',
      isConnected: false,
      isLoading: false,
      error: null
    });
    
    setShowHomepage(false);
    setShowModal(false);
    setShowDisconnectMessage(true);
    
    // Auto-hide message and return to landing page after 1.5 seconds
    setTimeout(() => {
      setShowDisconnectMessage(false);
    }, 1500);
  };

  // Handler for Massa Wallet input submit
  const handleMassaInputSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputPrivateKey) {
      setInputError('Private key is required.');
      return;
    }
    
    setIsConnecting(true);
    setInputError('');
    setWalletState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      // Use the wallet connection utility with only private key
      const result = await connectWithPrivateKey('', inputPrivateKey);
      
      if (result.success) {
        setWalletState({
          provider: result.provider || null,
          wallet: result.wallet || null,
          balance: result.balance || '0',
          isConnected: true,
          isLoading: false,
          error: null
        });
        
        // Show success message in place of input
        setInputPrivateKey('');
        setInputError('');
        
        // Show homepage after 1.5 seconds
        setTimeout(() => {
          setShowHomepage(true);
        }, 1500);
      } else {
        setInputError(result.error || 'Failed to connect wallet');
        setWalletState(prev => ({ ...prev, isLoading: false, error: result.error || 'Connection failed' }));
      }
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to connect to Massa buildnet.';
      setInputError(errorMessage);
      setWalletState(prev => ({ ...prev, isLoading: false, error: errorMessage }));
      console.error('Massa connection error:', err);
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <>
      <GlobalStyle />
      {showDisconnectMessage && (
        <DisconnectMessage>
          Wallet disconnected successfully
        </DisconnectMessage>
      )}
      {showHomepage ? (
        <HomepageContainer>
          <Header>
            <HeaderLogo src={OdinLogoH} alt="Odin Logo" />
            <HeaderWalletInfo>
              <WalletBalance>{parseFloat(walletState.balance || '0').toFixed(2)} MAS</WalletBalance>
              <DisconnectButton onClick={handleDisconnectWallet}>
                Disconnect
              </DisconnectButton>
            </HeaderWalletInfo>
          </Header>
          
          <MainContent>
            <GridContainer>
              <SectionCard delay={0}>
                <SectionTitle>
                  <SectionIcon>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M3 3v18h18"/>
                      <path d="M18.7 8l-5.1 5.2-2.8-2.7L7 14.3"/>
                    </svg>
                  </SectionIcon>
                  Trading Portfolios & Active Strategies
                </SectionTitle>
                <EmptyState>
                  <EmptyStateIcon>
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M3 3v18h18"/>
                      <path d="M18.7 8l-5.1 5.2-2.8-2.7L7 14.3"/>
                    </svg>
                  </EmptyStateIcon>
                  <EmptyStateText>No Active Strategies</EmptyStateText>
                  <EmptyStateSubtext>Your trading portfolios and strategies will appear here</EmptyStateSubtext>
                </EmptyState>
              </SectionCard>
              
              <SectionCard delay={1}>
                <SectionTitle>
                  <SectionIcon>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                    </svg>
                  </SectionIcon>
                  Wallet Summary
                </SectionTitle>
                <WalletSummary>
                  <CoinBalance>
                    <CoinInfo>
                      <CoinIcon $isImage={true}>
                        <img src={MassaLogo} alt="Massa" />
                      </CoinIcon>
                      <CoinDetails>
                        <CoinName>Massa</CoinName>
                        <CoinSymbol>MAS</CoinSymbol>
                      </CoinDetails>
                    </CoinInfo>
                    <CoinAmount>{parseFloat(walletState.balance || '0').toFixed(2)}</CoinAmount>
                  </CoinBalance>
                </WalletSummary>
              </SectionCard>
            </GridContainer>
          </MainContent>
        </HomepageContainer>
      ) : (
      <PageContainer>
        <LogoImg src={OdinLogoV} alt="Odin Logo Vertical" />
        <Slogan>All-Seeing, All-Winning</Slogan>
        <SloganUnderline />
        <LoginButton style={{ marginTop: 32 }} onClick={handleOpenModal}>
          Login
        </LoginButton>
        {showModal && (
          <ModalBackdrop onClick={handleCloseModal}>
            <ModalPanel onClick={e => e.stopPropagation()}>
              <CloseButton onClick={handleCloseModal} title="Close">×</CloseButton>
              
                
              
              <TabsContainer>
                <Tab active={activeTab === 'wallet'} onClick={() => setActiveTab('wallet')}>Connect Wallets</Tab>
                  <Tab active={activeTab === 'login'} onClick={() => setActiveTab('login')}>Login</Tab>
              </TabsContainer>
              <SlidingTabsContainer activeTab={activeTab}>
                <SlidingTabsInner activeTab={activeTab}>
                  <SlidingTabContent>
                    <WalletsList>
                      <WalletOption onClick={handleConnectMassaWallet} style={{ flexDirection: 'column', alignItems: 'stretch', paddingBottom: showMassaInput ? 0 : undefined }}>
                        <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                          <WalletIcon>
                            <svg width="28" height="28" viewBox="0 0 48 48"><circle cx="24" cy="24" r="20" fill="#00F5FF" /></svg>
                          </WalletIcon>
                                                  <WalletInfo>
                          <WalletName>
                            {isConnecting ? 'Connecting...' : 
                             walletState.isConnected ? 'Connected to Buildnet' : 'Massa Wallet (Buildnet)'}
                          </WalletName>
                          <WalletDesc>
                            {isConnecting ? 'Please wait...' : 'Connect with private key'}
                          </WalletDesc>
                          {walletState.isConnected && (
                            <div style={{ 
                              color: '#00F5FF', 
                              fontSize: '0.85rem', 
                              marginTop: 4,
                              width: '100%',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              textAlign: 'left',
                              whiteSpace: 'nowrap'
                            }}>
                              {walletState.balance} MAS
                            </div>
                          )}
                          {inputError && (
                            <div style={{ 
                              color: '#FFD700', 
                              fontSize: '0.85rem', 
                              marginTop: 4,
                              width: '100%',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              textAlign: 'left',
                              whiteSpace: 'nowrap'
                            }}>
                              Error: {inputError}
                            </div>
                          )}
                        </WalletInfo>
                          <WalletArrow>
                            <img 
                              src={ExpandArrow} 
                              alt="expand" 
                              style={{ 
                                width: '16px', 
                                height: '16px',
                                transform: showMassaInput ? 'rotate(180deg)' : 'rotate(90deg)',
                                transition: 'transform 0.2s ease',
                                filter: 'invert(85%) sepia(100%) saturate(1000%) hue-rotate(180deg)'
                              }} 
                            />
                          </WalletArrow>
                        </div>
                        {showMassaInput && (
                          <AccordionInputContainer onClick={e => e.stopPropagation()}>
                            {walletState.isConnected ? (
                              <div style={{ 
                                width: '100%', 
                                display: 'flex', 
                                flexDirection: 'column', 
                                alignItems: 'center', 
                                paddingLeft: '20px', 
                                paddingRight: '20px',
                                paddingBottom: '20px'
                              }}>
                                <div style={{ 
                                  color: '#10B981', 
                                  fontSize: '1.1rem', 
                                  fontWeight: '600',
                                  textAlign: 'center',
                                  marginBottom: '10px'
                                }}>
                                  ✓ Wallet Connected Successfully
                                </div>
                                <div style={{ 
                                  color: '#aaa', 
                                  fontSize: '0.9rem', 
                                  textAlign: 'center',
                                  lineHeight: '1.4'
                                }}>
                                  Redirecting to homepage...
                                </div>
                              </div>
                            ) : (
                            <form onSubmit={handleMassaInputSubmit} style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', paddingLeft: '20px', paddingRight: '20px' }}>
                              <PasswordInput
                                placeholder="Private Key (S1...)"
                                value={inputPrivateKey}
                                onChange={e => setInputPrivateKey(e.target.value)}
                                style={{ marginBottom: 16, width: '100%', fontSize: '1.08rem' }}
                              />
                              {inputError && <div style={{ color: '#FFD700', marginBottom: 10, width: '100%' }}>{inputError}</div>}
                              <FormLoginButton 
                                type="submit" 
                                style={{ marginTop: 8, width: '100%' }}
                                disabled={isConnecting}
                              >
                                {isConnecting ? 'Connecting...' : 'Connect'}
                              </FormLoginButton>
                            </form>
                            )}
                          </AccordionInputContainer>
                        )}
                      </WalletOption>
                        <WalletOption onClick={handleConnectLedgerWallet} style={{ flexDirection: 'column', alignItems: 'stretch', paddingBottom: showLedgerInput ? 0 : undefined }}>
                          <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                        <WalletIcon>
                          <svg width="28" height="28" viewBox="0 0 48 48"><rect x="8" y="8" width="32" height="32" rx="8" fill="#FFD700" /></svg>
                        </WalletIcon>
                        <WalletInfo>
                          <WalletName>Ledger</WalletName>
                          <WalletDesc>Hardware wallet</WalletDesc>
                        </WalletInfo>
                        <WalletArrow>
                          <img 
                            src={ExpandArrow} 
                            alt="expand" 
                            style={{ 
                              width: '16px', 
                              height: '16px',
                                  transform: showLedgerInput ? 'rotate(180deg)' : 'rotate(90deg)',
                              transition: 'transform 0.2s ease',
                              filter: 'invert(85%) sepia(100%) saturate(1000%) hue-rotate(180deg)'
                            }} 
                          />
                        </WalletArrow>
                          </div>
                          {showLedgerInput && (
                            <AccordionInputContainer onClick={e => e.stopPropagation()}>
                              <div style={{ 
                                width: '100%', 
                                display: 'flex', 
                                flexDirection: 'column', 
                                alignItems: 'center', 
                                paddingLeft: '20px', 
                                paddingRight: '20px',
                                paddingBottom: '20px'
                              }}>
                                <div style={{ 
                                  color: '#FFD700', 
                                  fontSize: '1.1rem', 
                                  fontWeight: '600',
                                  textAlign: 'center',
                                  marginBottom: '10px'
                                }}>
                                  Coming Soon
                                </div>
                                <div style={{ 
                                  color: '#aaa', 
                                  fontSize: '0.9rem', 
                                  textAlign: 'center',
                                  lineHeight: '1.4'
                                }}>
                                  Ledger hardware wallet integration will be available in a future update.
                                </div>
                              </div>
                            </AccordionInputContainer>
                          )}
                      </WalletOption>
                    </WalletsList>
                  </SlidingTabContent>
                    <SlidingTabContent>
                      <LoginTabContent>
                        <LoginButton variant="google" style={{ margin: '12px 0', opacity: 1, animation: 'none', width: '100%' }}>
                          <LoginIcon variant="google">
                            <svg width="22" height="22" viewBox="0 0 48 48">
                              <g>
                                <path className="google-g" d="M43.611 20.083H42V20H24v8h11.303C33.978 32.833 29.418 36 24 36c-6.627 0-12-5.373-12-12s5.373-12 12-12c2.438 0 4.7.751 6.573 2.037l6.418-6.418C33.684 5.084 29.084 3 24 3 12.954 3 4 11.954 4 23s8.954 20 20 20c11.046 0 20-8.954 20-20 0-1.341-.138-2.651-.389-3.917z"/>
                              </g>
                            </svg>
                          </LoginIcon>
                          Login with Google
                        </LoginButton>
                        <OrDivider>or</OrDivider>
                        <form style={{ width: '100%', maxWidth: '100%', marginTop: 10, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                          <EmailInput
                            type="email"
                            placeholder="Email address"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                          />
                          <PasswordInput
                            placeholder="Password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                          />
                          <ForgotLink href="#">Forgot password?</ForgotLink>
                          <FormLoginButton type="submit">Login</FormLoginButton>
                        </form>
                        <ComingSoonOverlay>
                          <div style={{ 
                            color: '#FFD700', 
                            fontSize: '1.3rem', 
                            fontWeight: '700',
                            textAlign: 'center',
                            marginBottom: '8px',
                            textTransform: 'uppercase',
                            letterSpacing: '1px'
                          }}>
                            Coming Soon
                          </div>
                          <div style={{ 
                            color: '#aaa', 
                            fontSize: '0.95rem', 
                            textAlign: 'center',
                            lineHeight: '1.4',
                            maxWidth: '280px'
                          }}>
                            Traditional login functionality will be available in a future update.
                          </div>
                        </ComingSoonOverlay>
                      </LoginTabContent>
                    </SlidingTabContent>
                </SlidingTabsInner>
              </SlidingTabsContainer>
            </ModalPanel>
          </ModalBackdrop>
        )}
      </PageContainer>
      )}
    </>
  );
}

export default App;
