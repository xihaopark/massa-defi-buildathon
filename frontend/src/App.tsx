import { useState, useEffect, useRef } from 'react';
import styled, { keyframes, createGlobalStyle } from 'styled-components';
import OdinLogoV from './assets/odin-logo-v.svg';
import OdinLogoH from './assets/odin-logo-h.svg';
import ExpandArrow from './assets/expand-arrow.svg';
import MassaLogo from './assets/massa-logo.jpeg';
import { connectWithPrivateKey, disconnectWallet, connectWalletBuildnet, connectWithAccount } from './utils/massaWallet';
import type { WalletState, WalletAccount } from './types';

const GlobalStyle = createGlobalStyle`
  html, body, #root {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
    background: #0A1226;
    min-height: 100vh;
    width: 100vw;
    font-family: 'Liter', -apple-system, BlinkMacSystemFont, sans-serif;
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
  font-family: 'Liter', -apple-system, BlinkMacSystemFont, sans-serif;
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
  background: #1a2337;
  border-radius: 12px;
  padding: 32px;
  width: 90%;
  max-width: 480px;
  position: relative;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
  animation: ${loginFadeInUp} 0.4s cubic-bezier(0.4,0,0.2,1);
  height: 600px;
  overflow-x: hidden;
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

const Tab = styled.button.withConfig({
  shouldForwardProp: (prop) => prop !== 'active'
})<{ active?: boolean }>`
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

const SlidingTabsContainer = styled.div.withConfig({
  shouldForwardProp: (prop) => prop !== 'activeTab'
})<{ activeTab: 'login' | 'wallet' }>`
  width: 100%;
  min-height: 340px;
  overflow: hidden;
  position: relative;
`;

const SlidingTabsInner = styled.div.withConfig({
  shouldForwardProp: (prop) => prop !== 'activeTab'
})<{ activeTab: 'login' | 'wallet' }>`
  display: flex;
  width: 200%;
  transition: transform 0.35s cubic-bezier(0.4,0,0.2,1);
  transform: translateX(${({ activeTab }) => (activeTab === 'wallet' ? '0%' : '-50%')});
`;

const SlidingTabContent = styled.div`
  position: relative;
  width: 100%;
  overflow-y: auto;
  max-height: 60vh;
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
  font-family: 'Liter', -apple-system, BlinkMacSystemFont, sans-serif;
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
  position: relative;
  z-index: 3000;
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
  position: relative;
  z-index: 3000;
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
  position: relative;
  z-index: 0;
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

const SectionCard = styled.div<{ delay?: number }>`
  background: #181f36;
  border: 1px solid #232b4a;
  border-radius: 16px;
  padding: 24px;
  min-height: 300px;
  animation: ${contentFadeIn} 0.8s cubic-bezier(0.4,0,0.2,1) ${({ delay = 0 }) => 0.6 + delay * 0.1}s both;
  position: relative;
  z-index: 0;
  
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

// Replace WalletAddressSection, WalletAddressValue, and CopyButton definitions and their usage in the homepage Wallet Summary section

// 1. Update styled-components for overlay effect
const WalletAddressSection = styled.div`
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px solid #232b4a;
  display: flex;
  align-items: center;
  gap: 8px;
  color: #aaa;
  font-size: 0.85rem;
  position: relative;
  width: 100%;
`;

const WalletAddressLabel = styled.span`
  font-weight: 500;
  white-space: nowrap;
`;

// Update WalletAddressValueWrapper and CopyOverlayButton so overlay only covers the address
const WalletAddressValueWrapper = styled.div`
  position: relative;
  display: inline-flex;
  align-items: center;
  min-width: 0;
  cursor: pointer;
`;

const WalletAddressValue = styled.span`
  font-family: 'Monospace', monospace;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  z-index: 1;
  padding-right: 60px;
`;

// Update CopyOverlayButton to accept a prop for visibility
const CopyOverlayButton = styled.button`
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  background: rgba(10, 18, 38, 0.45);
  color: #00F5FF;
  border: none;
  border-radius: 4px;
  font-size: 0.85rem;
  font-weight: 500;
  cursor: pointer;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding-right: 12px;
  width: calc(100% - 0px);
  min-width: 60px;
  max-width: 100%;
  pointer-events: auto;
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
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 245, 255, 0.9);
  color: #0A1226;
  padding: 12px 20px;
  border-radius: 6px;
  font-weight: 500;
  font-size: 0.9rem;
  font-family: 'Liter', -apple-system, BlinkMacSystemFont, sans-serif;
  z-index: 1000;
  box-shadow: 0 4px 12px rgba(0, 245, 255, 0.3);
  backdrop-filter: blur(8px);
`;


// WalletsList and WalletOption styles for Connect Wallets tab
const WalletsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
  max-height: 50vh;
  overflow-y: auto;
  padding-right: 8px;
`;

const WalletOption = styled.button.withConfig({
  shouldForwardProp: (prop) => prop !== 'expanded'
})<{ expanded?: boolean }>`
  background: ${({ expanded }) => expanded ? '#232b4a' : 'transparent'};
  border: none;
  padding: 16px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  width: 100%;
  text-align: left;
  color: inherit;
  font-family: inherit;
  display: flex;
  align-items: center;
  gap: 12px;
  position: relative;
  
  &:hover {
    background: #232b4a;
  }
  
  &:focus {
    outline: none;
    background: #232b4a;
  }
  
  /* Ensure scroll events pass through */
  &:hover {
    pointer-events: auto;
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

const TabContentScrollContainer = styled.div`
  flex: 1;
  overflow-y: auto;
  max-height: 440px;
  min-height: 0;
`;

const walletSummaryFadeIn = keyframes`
  0% {
    opacity: 0;
    transform: translateY(10px) scale(0.98);
  }
  100% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
`;

const WalletSummaryDropdown = styled.div`
  position: fixed;
  top: 80px;
  right: 40px;
  z-index: 2000;
  min-width: 260px;
  max-width: 340px;
  background: #20294a;
  border: 1px solid #232b4a;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.25);
  padding: 20px;
  animation: ${walletSummaryFadeIn} 0.25s cubic-bezier(0.4,0,0.2,1);
`;

const WalletSummaryBackdrop = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: transparent;
  z-index: 1999;
`;

// SubSectionCard: for individual portfolios and strategies
const SubSectionCard = styled.div<{ delay?: number }>`
  background: #232b4a;
  border: 1px solid #232b4a;
  border-radius: 10px;
  padding: 18px 20px;
  margin-bottom: 18px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.07);
  animation: ${contentFadeIn} 0.7s cubic-bezier(0.4,0,0.2,1) ${({ delay = 0 }) => 0.6 + delay * 0.1}s both;
  position: relative;
  z-index: 0;
  cursor: pointer;
  transition: border 0.18s, box-shadow 0.18s;
  &:hover, &:focus {
    border: 2px solid #00F5FF;
    box-shadow: 0 0 0 2px #00F5FF33;
    outline: none;
  }
  &:active {
    border: 2px solid #00CFFF;
    box-shadow: 0 0 0 2px #00CFFF33;
  }
`;

// Virtual Market Monitor Component
const MonitorContainer = styled.div`
  min-height: 100vh;
  background: #0A1226;
  color: #fff;
  padding: 20px;
  animation: ${homepageFadeIn} 0.6s cubic-bezier(0.4,0,0.2,1) both;
`;

const MonitorHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 30px;
  padding: 20px;
  background: #141B35;
  border-radius: 12px;
  border: 1px solid #232b4a;
`;

const BackButton = styled.button`
  background: transparent;
  border: 1px solid #00F5FF;
  color: #00F5FF;
  padding: 10px 20px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.2s ease;
  
  &:hover {
    background: #00F5FF;
    color: #0A1226;
  }
`;

const MarketDataGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
`;

const DataCard = styled.div`
  background: #141B35;
  border: 1px solid #232b4a;
  border-radius: 12px;
  padding: 20px;
  
  h3 {
    color: #00F5FF;
    margin-bottom: 15px;
    font-size: 1.1rem;
  }
`;

const LiveChart = styled.div`
  background: #0A1226;
  border: 1px solid #232b4a;
  border-radius: 8px;
  height: 200px;
  position: relative;
  overflow: hidden;
  margin-bottom: 15px;
  padding: 10px;
`;

const StatusIndicator = styled.div<{ status: 'active' | 'inactive' }>`
  display: inline-block;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: ${({ status }) => status === 'active' ? '#10B981' : '#EF4444'};
  margin-right: 8px;
`;

// Chart components
const ChartSvg = styled.svg`
  width: 100%;
  height: 100%;
`;

const ChartLine = styled.path<{ color: string }>`
  fill: none;
  stroke: ${({ color }) => color};
  stroke-width: 2;
  stroke-linejoin: round;
  stroke-linecap: round;
`;

const ChartGrid = styled.line`
  stroke: #232b4a;
  stroke-width: 1;
  stroke-dasharray: 2,2;
`;

const ChartLegend = styled.div`
  position: absolute;
  top: 10px;
  right: 10px;
  background: rgba(10, 18, 38, 0.8);
  padding: 8px;
  border-radius: 4px;
  font-size: 0.75rem;
`;

const LegendItem = styled.div<{ color: string }>`
  display: flex;
  align-items: center;
  margin-bottom: 4px;
  
  &:last-child {
    margin-bottom: 0;
  }
  
  &::before {
    content: '';
    display: inline-block;
    width: 12px;
    height: 2px;
    background: ${({ color }) => color};
    margin-right: 6px;
  }
`;

// Simple line chart component
interface PriceChartProps {
  data: number[][];
  colors: string[];
  labels: string[];
}

function PriceChart({ data, colors, labels }: PriceChartProps) {
  const width = 600;
  const height = 180;
  const padding = { top: 10, right: 10, bottom: 20, left: 10 };
  
  // Calculate bounds
  const allValues = data.flat();
  const minValue = Math.min(...allValues) * 0.98;
  const maxValue = Math.max(...allValues) * 1.02;
  const range = maxValue - minValue;
  
  // Generate path for each line
  const generatePath = (values: number[]) => {
    const points = values.map((value, index) => {
      const x = (index / (values.length - 1)) * (width - padding.left - padding.right) + padding.left;
      const y = height - padding.bottom - ((value - minValue) / range) * (height - padding.top - padding.bottom);
      return `${x},${y}`;
    });
    return `M ${points.join(' L ')}`;
  };
  
  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <ChartSvg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio) => (
          <ChartGrid
            key={ratio}
            x1={padding.left}
            y1={padding.top + ratio * (height - padding.top - padding.bottom)}
            x2={width - padding.right}
            y2={padding.top + ratio * (height - padding.top - padding.bottom)}
          />
        ))}
        
        {/* Price lines */}
        {data.map((line, index) => (
          <ChartLine
            key={index}
            d={generatePath(line)}
            color={colors[index]}
          />
        ))}
      </ChartSvg>
      
      <ChartLegend>
        {labels.map((label, index) => (
          <LegendItem key={index} color={colors[index]}>
            {label}
          </LegendItem>
        ))}
      </ChartLegend>
    </div>
  );
}

interface VirtualMarketMonitorProps {
  portfolioId: number;
  strategyName: string;
  onBack: () => void;
}

function VirtualMarketMonitor({ portfolioId, strategyName, onBack }: VirtualMarketMonitorProps) {
  const [marketData, setMarketData] = useState<any>(null);
  const [ascStatus, setAscStatus] = useState<'active' | 'inactive'>('active');
  const [isLoading, setIsLoading] = useState(false);
  const [priceHistory, setPriceHistory] = useState<number[][]>([
    [], // ASC strategy line (real)
    [], // Market line 1 (display only)
    [], // Market line 2 (display only)
    []  // Market line 3 (display only)
  ]);
  
  // Initialize price history with random data
  useEffect(() => {
    const basePrice = 1000;
    const initData = Array(4).fill(null).map((_, lineIndex) => {
      return Array(50).fill(null).map((_, i) => {
        const trend = lineIndex === 0 ? 1.0002 : (0.9998 + Math.random() * 0.0006);
        const volatility = lineIndex === 0 ? 0.002 : 0.003 + lineIndex * 0.001;
        return basePrice * Math.pow(trend, i) + (Math.random() - 0.5) * basePrice * volatility;
      });
    });
    setPriceHistory(initData);
  }, []);
  
  // Update prices every second
  useEffect(() => {
    const interval = setInterval(() => {
      setPriceHistory(prev => {
        return prev.map((line, lineIndex) => {
          const newLine = [...line.slice(-49)]; // Keep last 49 points
          const lastPrice = newLine[newLine.length - 1] || 1000;
          const trend = lineIndex === 0 ? 1.0001 : (0.9999 + Math.random() * 0.0004);
          const volatility = lineIndex === 0 ? 0.002 : 0.003 + lineIndex * 0.001;
          const newPrice = lastPrice * trend + (Math.random() - 0.5) * lastPrice * volatility;
          newLine.push(newPrice);
          return newLine;
        });
      });
    }, 1000);
    
    return () => clearInterval(interval);
  }, []);
  
  // Fetch market data every 2 seconds
  useEffect(() => {
    const fetchMarketData = async () => {
      setIsLoading(true);
      try {
        // Import contract interaction utilities
        const { ContractInteraction } = await import('./utils/contractInteraction');
        const contractInteraction = new ContractInteraction();
        
        // Get virtual market data
        const marketResult = await contractInteraction.getVirtualMarketStatus();
        if (marketResult.success && marketResult.data) {
          setMarketData(marketResult.data);
        }
        
        // Interact with virtual market
        const interactionResult = await contractInteraction.interactWithVirtualMarket();
        console.log('Market interaction:', interactionResult);
        
      } catch (error) {
        console.error('Error fetching market data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchMarketData();
    const interval = setInterval(fetchMarketData, 2000);
    
    return () => clearInterval(interval);
  }, []);
  
  return (
    <MonitorContainer>
      <MonitorHeader>
        <div>
          <h1 style={{ margin: 0, marginBottom: 8 }}>Portfolio {portfolioId} Monitor</h1>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <StatusIndicator status={ascStatus} />
            <span>{strategyName} Strategy - {ascStatus === 'active' ? 'Active' : 'Inactive'}</span>
          </div>
        </div>
        <BackButton onClick={onBack}>← Back to Dashboard</BackButton>
      </MonitorHeader>
      
      <MarketDataGrid>
        <DataCard>
          <h3>Virtual Market Status</h3>
          <LiveChart>
            <PriceChart
              data={priceHistory}
              colors={['#00F5FF', '#FFD700', '#FF69B4', '#10B981']}
              labels={[
                `ASC ${strategyName} (Real)`,
                'Market BTC/MAS',
                'Market ETH/MAS',
                'Market SOL/MAS'
              ]}
            />
          </LiveChart>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <div>
              <div style={{ color: '#aaa', fontSize: '0.9rem' }}>Current Price</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
                {priceHistory[0].length > 0 ? priceHistory[0][priceHistory[0].length - 1].toFixed(2) : '1000.00'} MAS
              </div>
            </div>
            <div>
              <div style={{ color: '#aaa', fontSize: '0.9rem' }}>24h Change</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: priceHistory[0].length > 1 && priceHistory[0][priceHistory[0].length - 1] > priceHistory[0][0] ? '#10B981' : '#EF4444' }}>
                {priceHistory[0].length > 1 ? 
                  `${((priceHistory[0][priceHistory[0].length - 1] - priceHistory[0][0]) / priceHistory[0][0] * 100).toFixed(2)}%` 
                  : '+2.45%'}
              </div>
            </div>
          </div>
        </DataCard>
        
        <DataCard>
          <h3>ASC Strategy Performance</h3>
          <div style={{ marginBottom: 15 }}>
            <div style={{ color: '#aaa', marginBottom: 5 }}>Total Trades</div>
            <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>
              {marketData?.totalTrades || '147'}
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 15 }}>
            <div>
              <div style={{ color: '#aaa', fontSize: '0.9rem' }}>Win Rate</div>
              <div style={{ color: '#10B981', fontWeight: 'bold' }}>
                {marketData?.winRate || '68.5'}%
              </div>
            </div>
            <div>
              <div style={{ color: '#aaa', fontSize: '0.9rem' }}>Profit Factor</div>
              <div style={{ color: '#00F5FF', fontWeight: 'bold' }}>
                {marketData?.profitFactor || '1.85'}
              </div>
            </div>
          </div>
        </DataCard>
        
        <DataCard>
          <h3>Real-time ASC Interaction</h3>
          <div style={{ marginBottom: 15 }}>
            <div style={{ color: '#aaa', marginBottom: 5 }}>Last Execution</div>
            <div style={{ fontSize: '0.9rem' }}>
              {new Date().toLocaleTimeString()}
            </div>
          </div>
          <div style={{ marginBottom: 15 }}>
            <div style={{ color: '#aaa', marginBottom: 5 }}>Strategy State</div>
            <div style={{ color: '#FFD700', fontWeight: 'bold' }}>
              {marketData?.strategyState || 'ANALYZING'}
            </div>
          </div>
          <div>
            <div style={{ color: '#aaa', marginBottom: 5 }}>Gas Used (24h)</div>
            <div>{marketData?.gasUsed || '0.0245'} MAS</div>
          </div>
        </DataCard>
      </MarketDataGrid>
      
      <DataCard>
        <h3>Live Trading Activity</h3>
        <div style={{ maxHeight: 300, overflow: 'auto' }}>
          {[...Array(10)].map((_, i) => {
            const isBuy = strategyName === 'Multi-thread Attention' ? 
              i % 3 !== 0 : // Multi-thread strategy buys more often
              i % 2 === 0;  // Mean Reversion alternates more evenly
            const price = priceHistory[0].length > i ? 
              priceHistory[0][priceHistory[0].length - 1 - i] : 
              1000 + Math.random() * 50;
            const amount = strategyName === 'Multi-thread Attention' ?
              (Math.random() * 15 + 10).toFixed(2) : // Larger trades
              (Math.random() * 8 + 3).toFixed(2);   // Smaller, more frequent
            
            return (
              <div key={i} style={{ 
                padding: '10px', 
                borderBottom: '1px solid #232b4a',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <div style={{ fontWeight: 'bold', color: isBuy ? '#10B981' : '#EF4444' }}>
                    {isBuy ? 'BUY' : 'SELL'} Signal - {strategyName}
                  </div>
                  <div style={{ color: '#aaa', fontSize: '0.85rem' }}>
                    {new Date(Date.now() - i * 30000).toLocaleTimeString()}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ color: isBuy ? '#10B981' : '#EF4444', fontWeight: 'bold' }}>
                    {amount} MAS
                  </div>
                  <div style={{ color: '#aaa', fontSize: '0.85rem' }}>
                    @ {price.toFixed(2)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </DataCard>
    </MonitorContainer>
  );
}

function App() {
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'login' | 'wallet'>('wallet');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [currentPage, setCurrentPage] = useState<'main' | 'portfolio1' | 'portfolio2'>('main');
  
  const [walletState, setWalletState] = useState<WalletState>({
    provider: null,
    wallet: null,
    balance: '0',
    isConnected: false,
    isLoading: false,
    error: null,
    address: ''
  });
  
  const [showMassaInput, setShowMassaInput] = useState(false);
  const [showLedgerInput, setShowLedgerInput] = useState(false);
  const [inputPrivateKey, setInputPrivateKey] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnectingMassaStation, setIsConnectingMassaStation] = useState(false);
  const [availableAccounts, setAvailableAccounts] = useState<WalletAccount[]>([]);
  const [showAccountSelection, setShowAccountSelection] = useState(false);
  const [selectedWallet, setSelectedWallet] = useState<unknown>(null);
  const [currentNetwork, setCurrentNetwork] = useState<string>('');
  
  const [cachedMassaStationData, setCachedMassaStationData] = useState<{
    accounts: WalletAccount[];
    wallet: unknown;
    network: string;
  } | null>(null);
  
  const [connectionListener, setConnectionListener] = useState<{
    isListening: boolean;
    lastUpdate: number;
  }>({ isListening: false, lastUpdate: 0 });
  
  const [showHomepage, setShowHomepage] = useState(false);
  const [showDisconnectMessage, setShowDisconnectMessage] = useState(false);
  const [massaStationError, setMassaStationError] = useState('');
  const [massaWalletError, setMassaWalletError] = useState('');
  const [connectedWalletType, setConnectedWalletType] = useState<null | 'station' | 'privateKey'>(null);
  const [copied, setCopied] = useState(false);
  const [addressHovered, setAddressHovered] = useState(false);
  // Add state for showing the wallet summary popover
  const [showWalletSummary, setShowWalletSummary] = useState(false);
  const walletBalanceRef = useRef<HTMLDivElement | null>(null);
  const walletSummaryDropdownRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!cachedMassaStationData?.wallet || !connectionListener.isListening) {
      return;
    }

    const checkConnectionChanges = async () => {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const walletProvider = cachedMassaStationData.wallet as any;
        
        if (walletProvider && typeof walletProvider.isConnected === 'function') {
          const isConnected = await walletProvider.isConnected();
          if (!isConnected) {
            setCachedMassaStationData(null);
            setConnectionListener({ isListening: false, lastUpdate: Date.now() });
            setAvailableAccounts([]);
            setSelectedWallet(null);
            setCurrentNetwork('');
            setShowAccountSelection(false);
            setMassaStationError(''); // Clear error when connection fails
            return;
          }
        }

        let shouldRefresh = false;
        let newNetwork = cachedMassaStationData.network;
        
        if (walletProvider && typeof walletProvider.getAccounts === 'function') {
          const newAccounts = await walletProvider.getAccounts();
          if (newAccounts && newAccounts.length !== cachedMassaStationData.accounts.length) {
            shouldRefresh = true;
          }
        }
        
        try {
          if (walletProvider.networkInfos && typeof walletProvider.networkInfos === 'function') {
            const networkInfo = await walletProvider.networkInfos();
            if (networkInfo && networkInfo.name) {
              newNetwork = networkInfo.name.toLowerCase();
            } else if (networkInfo && typeof networkInfo === 'string') {
              newNetwork = networkInfo.toLowerCase();
            } else if (networkInfo && networkInfo.network) {
              newNetwork = networkInfo.network.toLowerCase();
            }
          } else if (walletProvider.getNetwork && typeof walletProvider.getNetwork === 'function') {
            const network = await walletProvider.getNetwork();
            newNetwork = network || '';
          } else if (walletProvider.network && typeof walletProvider.network === 'string') {
            newNetwork = walletProvider.network;
          } else if (walletProvider.getChainId && typeof walletProvider.getChainId === 'function') {
            const chainId = await walletProvider.getChainId();
            newNetwork = chainId === 77658366 ? 'mainnet' : 'buildnet';
          } else if (walletProvider.chainId && typeof walletProvider.chainId === 'number') {
            newNetwork = walletProvider.chainId === 77658366 ? 'mainnet' : 'buildnet';
          }
          
          if (newNetwork !== cachedMassaStationData.network) {
            shouldRefresh = true;
            console.log('Network changed from', cachedMassaStationData.network, 'to', newNetwork);
          }
        } catch (networkError) {
          console.log('Could not get network from wallet provider:', networkError);
        }
        
        if (shouldRefresh) {
          console.log('Refreshing Massa Station connection data due to changes');
          const result = await connectWalletBuildnet();
          if (result.success && result.accounts) {
            let detectedNetwork = '';
            
            try {
              if (walletProvider.networkInfos && typeof walletProvider.networkInfos === 'function') {
                const networkInfo = await walletProvider.networkInfos();
                if (networkInfo && networkInfo.name) {
                  detectedNetwork = networkInfo.name.toLowerCase();
                } else if (networkInfo && typeof networkInfo === 'string') {
                  detectedNetwork = networkInfo.toLowerCase();
                } else if (networkInfo && networkInfo.network) {
                  detectedNetwork = networkInfo.network.toLowerCase();
                }
              } else if (walletProvider.getNetwork && typeof walletProvider.getNetwork === 'function') {
                const network = await walletProvider.getNetwork();
                detectedNetwork = network || '';
              } else if (walletProvider.network && typeof walletProvider.network === 'string') {
                detectedNetwork = walletProvider.network;
              } else if (walletProvider.getChainId && typeof walletProvider.getChainId === 'function') {
                const chainId = await walletProvider.getChainId();
                detectedNetwork = chainId === 77658366 ? 'mainnet' : 'buildnet';
              } else if (walletProvider.chainId && typeof walletProvider.chainId === 'number') {
                detectedNetwork = walletProvider.chainId === 77658366 ? 'mainnet' : 'buildnet';
              }
            } catch (networkError) {
              console.log('Could not get network from wallet provider:', networkError);
              detectedNetwork = '';
            }

            const updatedData = {
              accounts: result.accounts,
              wallet: result.wallet,
              network: detectedNetwork
            };
            
            setCachedMassaStationData(updatedData);
            
            if (showAccountSelection) {
              setAvailableAccounts(result.accounts);
              setCurrentNetwork(detectedNetwork);
            }
            
            setConnectionListener(prev => ({ ...prev, lastUpdate: Date.now() }));
          }
        }
      } catch (error) {
        console.error('Error checking connection changes:', error);
      }
    };

    const interval = setInterval(checkConnectionChanges, 1000);
    
    return () => clearInterval(interval);
  }, [cachedMassaStationData, connectionListener.isListening, showAccountSelection]);

  useEffect(() => {
    if (!showWalletSummary) return;
    function handleClickOutside(event: MouseEvent) {
      const balanceNode = walletBalanceRef.current;
      const dropdownNode = walletSummaryDropdownRef.current;
      if (
        balanceNode && !balanceNode.contains(event.target as Node) &&
        dropdownNode && !dropdownNode.contains(event.target as Node)
      ) {
        setShowWalletSummary(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showWalletSummary]);

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
    setMassaStationError(''); // Clear Massa Station error
    setMassaWalletError(''); // Clear Massa Wallet error
    setCachedMassaStationData(null);
    setAvailableAccounts([]);
    setSelectedWallet(null);
    setCurrentNetwork('');
    setShowAccountSelection(false);
    setConnectionListener({ isListening: false, lastUpdate: Date.now() });
  };

  const handleConnectMassaWallet = () => {
    // Collapse other options first
    setShowLedgerInput(false);
    setShowAccountSelection(false); // Collapse Massa Station
    setMassaStationError(''); // Reset Massa Station error
    setShowMassaInput((prev) => !prev);
    setMassaWalletError(''); // Clear Massa Wallet error
  };

  const handleConnectLedgerWallet = () => {
    // Collapse other options first
    setShowMassaInput(false);
    setShowAccountSelection(false); // Collapse Massa Station
    setMassaStationError(''); // Reset Massa Station error
    setShowLedgerInput((prev) => !prev);
  };

  const handleConnectMassaStation = async () => {
    if (showAccountSelection) {
      setShowAccountSelection(false);
      return;
    }

    setShowMassaInput(false);
    setShowLedgerInput(false);

    if (cachedMassaStationData) {
      setAvailableAccounts(cachedMassaStationData.accounts);
      setSelectedWallet(cachedMassaStationData.wallet);
      setCurrentNetwork(cachedMassaStationData.network);
      setShowAccountSelection(true);
      setMassaStationError(''); // Clear Massa Station error
      return;
    }

    setIsConnectingMassaStation(true);
    setMassaStationError(''); // Clear Massa Station error
    setWalletState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const result = await connectWalletBuildnet();
      
      if (result.success && result.accounts) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const walletProvider = result.wallet as any;
        let detectedNetwork = '';
        
        try {
          if (walletProvider.networkInfos && typeof walletProvider.networkInfos === 'function') {
            const networkInfo = await walletProvider.networkInfos();
            console.log("Network info:", networkInfo);
            
            if (networkInfo && networkInfo.name) {
              detectedNetwork = networkInfo.name.toLowerCase();
            } else if (networkInfo && typeof networkInfo === 'string') {
              detectedNetwork = networkInfo.toLowerCase();
            } else if (networkInfo && networkInfo.network) {
              detectedNetwork = networkInfo.network.toLowerCase();
            }
          } else {
            console.log('networkInfos() method not available, trying fallback methods');
            
            if (walletProvider.getNetwork && typeof walletProvider.getNetwork === 'function') {
              const network = await walletProvider.getNetwork();
              console.log('getNetwork() result:', network);
              detectedNetwork = network || '';
            } else if (walletProvider.network && typeof walletProvider.network === 'string') {
              console.log('Using walletProvider.network:', walletProvider.network);
              detectedNetwork = walletProvider.network;
            } else if (walletProvider.getChainId && typeof walletProvider.getChainId === 'function') {
              const chainId = await walletProvider.getChainId();
              console.log('getChainId() result:', chainId);
              detectedNetwork = chainId === 77658366 ? 'mainnet' : 'buildnet';
            } else if (walletProvider.chainId && typeof walletProvider.chainId === 'number') {
              console.log('Using walletProvider.chainId:', walletProvider.chainId);
              detectedNetwork = walletProvider.chainId === 77658366 ? 'mainnet' : 'buildnet';
            } else {
              if (result.accounts && result.accounts.length > 0) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const firstAccount = result.accounts[0] as any;
                console.log('First account properties:', Object.getOwnPropertyNames(firstAccount));
                console.log('First account network:', firstAccount.network);
                if (firstAccount.provider && firstAccount.provider.network) {
                  console.log('Account provider network:', firstAccount.provider.network);
                  detectedNetwork = firstAccount.provider.network;
                } else if (firstAccount.network) {
                  console.log('Account network:', firstAccount.network);
                  detectedNetwork = firstAccount.network;
                }
              }
            }
          }
          
          console.log('Final detected network:', detectedNetwork);
        } catch (networkError) {
          console.log('Could not get network from wallet provider:', networkError);
          detectedNetwork = '';
        }
        
        const connectionData = {
          accounts: result.accounts,
          wallet: result.wallet,
          network: detectedNetwork
        };
        setCachedMassaStationData(connectionData);
        
        setConnectionListener({ isListening: true, lastUpdate: Date.now() });
        
        setAvailableAccounts(result.accounts);
        setSelectedWallet(result.wallet);
        setCurrentNetwork(detectedNetwork);
        setShowAccountSelection(true);
        setWalletState(prev => ({ ...prev, isLoading: false }));
      } else {
        setMassaStationError(result.error || 'Failed to connect to Massa Station');
        setWalletState(prev => ({ ...prev, isLoading: false, error: result.error || 'Connection failed' }));
      }
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to connect to Massa Station.';
      setMassaStationError(errorMessage);
      setWalletState(prev => ({ ...prev, isLoading: false, error: errorMessage }));
      console.error('Massa Station connection error:', err);
    } finally {
      setIsConnectingMassaStation(false);
    }
  };

  const handleSelectAccount = async (accountIndex: number) => {
    if (!selectedWallet) return;
    
    setIsConnectingMassaStation(true);
    setMassaStationError(''); // Clear Massa Station error
    
    try {
      const result = await connectWithAccount(selectedWallet, accountIndex);
      
      if (result.success) {
        setWalletState({
          provider: result.provider || null,
          wallet: result.wallet || null,
          balance: result.balance || '0',
          isConnected: true,
          isLoading: false,
          error: null,
          address: result.address || ''
        });
        setConnectedWalletType('station');
        
        setTimeout(() => {
          setShowHomepage(true);
          setShowWalletSummary(false);
        }, 1500);
      } else {
        setMassaStationError(result.error || 'Failed to connect with selected account');
      }
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to connect with selected account.';
      setMassaStationError(errorMessage);
      console.error('Account selection error:', err);
    } finally {
      setIsConnectingMassaStation(false);
    }
  };


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
      error: null,
      address: ''
    });
    
    setShowHomepage(false);
    setShowModal(false);
    setShowDisconnectMessage(true);
    
    setCachedMassaStationData(null);
    setAvailableAccounts([]);
    setSelectedWallet(null);
    setCurrentNetwork('');
    setShowAccountSelection(false);
    setMassaStationError(''); // Clear Massa Station error
    setMassaWalletError(''); // Clear Massa Wallet error
    setConnectedWalletType(null);
    
    setTimeout(() => {
      setShowDisconnectMessage(false);
    }, 1500);
  };

  const handleCopyAddress = async () => {
    try {
      await navigator.clipboard.writeText(walletState.address);
      setCopied(true);
      setTimeout(() => {
        setCopied(false);
      }, 1000);
    } catch (err) {
      console.error('Failed to copy address:', err);
    }
  };

  const handleMassaInputSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputPrivateKey) {
      setMassaWalletError('Private key is required.');
      return;
    }
    
    setIsConnecting(true);
    setMassaWalletError(''); // Clear Massa Wallet error
    setWalletState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const result = await connectWithPrivateKey(inputPrivateKey);
      
      if (result.success) {
        setWalletState({
          provider: result.provider || null,
          wallet: result.wallet || null,
          balance: result.balance || '0',
          isConnected: true,
          isLoading: false,
          error: null,
          address: result.address || ''
        });
        setConnectedWalletType('privateKey');
        setInputPrivateKey('');
        setMassaWalletError(''); // Clear Massa Wallet error
        
        setTimeout(() => {
          setShowHomepage(true);
          setShowWalletSummary(false);
        }, 1500);
      } else {
        setMassaWalletError(result.error || 'Failed to connect wallet');
        setWalletState(prev => ({ ...prev, isLoading: false, error: result.error || 'Connection failed' }));
      }
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to connect to Massa buildnet.';
      setMassaWalletError(errorMessage);
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
        <>
          {currentPage === 'main' ? (
            <HomepageContainer>
              <Header>
                <HeaderLogo src={OdinLogoH} alt="Odin Logo" />
                <HeaderWalletInfo style={{ position: 'relative' }}>
              <WalletBalance
                ref={walletBalanceRef}
                onClick={() => setShowWalletSummary(v => !v)}
                style={{ cursor: 'pointer', userSelect: 'none' }}
                tabIndex={0}
                title="Show wallet summary"
              >
                {currentNetwork ? (
                  <span
                    style={{
                      color: '#0A1226',
                      background: 'transparent',
                      border: '1.5px solid #0A1226',
                      fontWeight: 700,
                      marginRight: 8,
                      fontSize: '0.95em',
                      letterSpacing: '0.02em',
                      borderRadius: '8px',
                      padding: '2px 10px',
                      display: 'inline-block',
                      textTransform: 'lowercase',
                    }}
                  >
                    {currentNetwork}
                  </span>
                ) : null}
                {parseFloat(walletState.balance || '0').toFixed(2)} MAS
              </WalletBalance>
              {showWalletSummary && (
                <>
                  <WalletSummaryBackdrop onClick={() => setShowWalletSummary(false)} />
                  <WalletSummaryDropdown ref={walletSummaryDropdownRef} onClick={e => e.stopPropagation()}>
                    <WalletSummary style={{ marginBottom: 0 }}>
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
                      {walletState.address && (
                        <WalletAddressSection>
                          <WalletAddressLabel>Address:</WalletAddressLabel>
                          <WalletAddressValueWrapper
                            onClick={handleCopyAddress}
                            title="Copy address to clipboard"
                            tabIndex={0}
                            role="button"
                            style={{ outline: 'none' }}
                            onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') handleCopyAddress(); }}
                            onMouseEnter={() => setAddressHovered(true)}
                            onMouseLeave={() => setAddressHovered(false)}
                            onFocus={() => setAddressHovered(true)}
                            onBlur={() => setAddressHovered(false)}
                          >
                            <WalletAddressValue>{walletState.address}</WalletAddressValue>
                            {(addressHovered || copied) && (
                              <CopyOverlayButton type="button">{copied ? 'Copied' : 'Copy'}</CopyOverlayButton>
                            )}
                          </WalletAddressValueWrapper>
                        </WalletAddressSection>
                      )}
                      <DisconnectButton style={{ marginTop: 18, width: '100%' }} onClick={handleDisconnectWallet}>
                Disconnect
              </DisconnectButton>
                    </WalletSummary>
                  </WalletSummaryDropdown>
                </>
              )}
            </HeaderWalletInfo>
          </Header>
          
          <MainContent>
            {/* Full-width SectionCard for Trading Portfolios */}
            <div style={{ display: 'flex', gap: 32, width: '100%', alignItems: 'flex-start' }}>
              <SectionCard delay={0} style={{ flex: 2, maxWidth: '100%', marginBottom: 40, boxSizing: 'border-box' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
                  <SectionTitle style={{ marginRight: 24, flex: 1, display: 'flex', alignItems: 'center' }}>
                  <SectionIcon>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M3 3v18h18"/>
                      <path d="M18.7 8l-5.1 5.2-2.8-2.7L7 14.3"/>
                    </svg>
                  </SectionIcon>
                    Trading Portfolios
                </SectionTitle>
                  <div style={{ display: 'flex', gap: 12 }}>
                    <button
                      style={{
                        background: '#00F5FF',
                        color: '#0A1226',
                        border: 'none',
                        borderRadius: 8,
                        padding: '10px 18px',
                        fontWeight: 700,
                        fontFamily: 'Inter, sans-serif',
                        fontSize: '1rem',
                        cursor: 'pointer',
                        transition: 'background 0.18s, color 0.18s, box-shadow 0.18s',
                        boxShadow: '0 2px 12px #00F5FF22',
                      }}
                    >
                      New
                    </button>
                  </div>
                </div>
                {(() => {
                  const hasPortfolio = true; // Set to true if there are portfolios, false otherwise
                  if (!hasPortfolio) {
                    return (
                <EmptyState>
                  <EmptyStateIcon>
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M3 3v18h18"/>
                      <path d="M18.7 8l-5.1 5.2-2.8-2.7L7 14.3"/>
                    </svg>
                  </EmptyStateIcon>
                        <EmptyStateText>No Portfolios</EmptyStateText>
                        <EmptyStateSubtext>Your trading portfolios will appear here</EmptyStateSubtext>
                </EmptyState>
                    );
                  }
                  return null;
                })()}
                {/* Action Buttons */}
                {/* Portfolio 1 Card */}
                <SubSectionCard delay={0.1} onClick={() => setCurrentPage('portfolio1')}>
                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: 18 }}>
                    <div style={{ fontWeight: 700, fontSize: '1.15rem', color: '#00F5FF', marginRight: 12 }}>Portfolio 1</div>
                    <span style={{ background: '#FFD700', color: '#0A1226', fontWeight: 700, fontSize: '0.92rem', borderRadius: 16, padding: '4px 14px', marginLeft: 0, display: 'inline-block', letterSpacing: '0.01em' }}>Multi-thread Attention</span>
                  </div>
                  <div style={{ display: 'flex', gap: 32, marginBottom: 18 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ color: '#aaa', fontSize: '0.98rem', fontWeight: 600, marginBottom: 4 }}>NET LIQUIDATION VALUE</div>
                      <div style={{ fontWeight: 800, fontSize: '2.1rem', color: '#fff', letterSpacing: '-1px' }}>200.00 MAS</div>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ color: '#aaa', fontSize: '0.98rem', fontWeight: 600, marginBottom: 4 }}>DAILY P&L</div>
                      <div style={{ fontWeight: 800, fontSize: '2.1rem', color: '#10B981', letterSpacing: '-1px' }}>+32.50 MAS</div>
                      <div style={{ color: '#10B981', fontWeight: 600, fontSize: '1.05rem', marginTop: 2 }}>(+2.78%)</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 24, marginBottom: 10 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ color: '#aaa', fontSize: '0.78rem', fontWeight: 600, marginBottom: 2 }}>UNREALISED P&L</div>
                      <div style={{ color: '#fff', fontWeight: 700, fontSize: '1.05rem' }}>+12.00 MAS</div>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ color: '#aaa', fontSize: '0.78rem', fontWeight: 600, marginBottom: 2 }}>MKT VAL</div>
                      <div style={{ color: '#fff', fontWeight: 700, fontSize: '1.05rem' }}>180.00 MAS</div>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ color: '#aaa', fontSize: '0.78rem', fontWeight: 600, marginBottom: 2 }}>CASH</div>
                      <div style={{ color: '#fff', fontWeight: 700, fontSize: '1.05rem' }}>20.00 MAS</div>
                    </div>
                  </div>
                </SubSectionCard>
                {/* Portfolio 2 Card */}
                <SubSectionCard delay={0.15} onClick={() => setCurrentPage('portfolio2')}>
                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: 18 }}>
                    <div style={{ fontWeight: 700, fontSize: '1.15rem', color: '#00F5FF', marginRight: 12 }}>Portfolio 2</div>
                    <span style={{ background: '#FF69B4', color: '#0A1226', fontWeight: 700, fontSize: '0.92rem', borderRadius: 16, padding: '4px 14px', marginLeft: 0, display: 'inline-block', letterSpacing: '0.01em' }}>Mean Reversion</span>
                  </div>
                  <div style={{ display: 'flex', gap: 32, marginBottom: 18 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ color: '#aaa', fontSize: '0.98rem', fontWeight: 600, marginBottom: 4 }}>NET LIQUIDATION VALUE</div>
                      <div style={{ fontWeight: 800, fontSize: '2.1rem', color: '#fff', letterSpacing: '-1px' }}>100.00 MAS</div>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ color: '#aaa', fontSize: '0.98rem', fontWeight: 600, marginBottom: 4 }}>DAILY P&L</div>
                      <div style={{ fontWeight: 800, fontSize: '2.1rem', color: '#10B981', letterSpacing: '-1px' }}>+120.00 MAS</div>
                      <div style={{ color: '#10B981', fontWeight: 600, fontSize: '1.05rem', marginTop: 2 }}>(+5.04%)</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 24, marginBottom: 10 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ color: '#aaa', fontSize: '0.78rem', fontWeight: 600, marginBottom: 2 }}>UNREALISED P&L</div>
                      <div style={{ color: '#fff', fontWeight: 700, fontSize: '1.05rem' }}>+30.00 MAS</div>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ color: '#aaa', fontSize: '0.78rem', fontWeight: 600, marginBottom: 2 }}>MKT VAL</div>
                      <div style={{ color: '#fff', fontWeight: 700, fontSize: '1.05rem' }}>80.00 MAS</div>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ color: '#aaa', fontSize: '0.78rem', fontWeight: 600, marginBottom: 2 }}>CASH</div>
                      <div style={{ color: '#fff', fontWeight: 700, fontSize: '1.05rem' }}>20.00 MAS</div>
                    </div>
                  </div>
                </SubSectionCard>
              </SectionCard>
              {/* Strategies Card */}
              <SectionCard delay={0.2} style={{ flex: 1, minWidth: 280, maxWidth: 340, alignSelf: 'flex-start', boxSizing: 'border-box' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                  <SectionTitle style={{ marginRight: 16, flex: 1, display: 'flex', alignItems: 'center' }}>
                    <SectionIcon>
                      {/* Classic light bulb icon for strategy */}
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M9 18h6" />
                        <path d="M10 22h4" />
                        <path d="M12 2a7 7 0 0 0-7 7c0 3.5 2.5 6.5 6 7v2h2v-2c3.5-0.5 6-3.5 6-7a7 7 0 0 0-7-7z" />
                      </svg>
                    </SectionIcon>
                    Strategies
                  </SectionTitle>
                  <button
                    style={{
                      background: '#00F5FF',
                      color: '#0A1226',
                      border: 'none',
                      borderRadius: 8,
                      padding: '10px 18px',
                      fontWeight: 700,
                      fontFamily: 'Inter, sans-serif',
                      fontSize: '1rem',
                      cursor: 'pointer',
                      transition: 'background 0.18s, color 0.18s, box-shadow 0.18s',
                      boxShadow: '0 2px 12px #00F5FF22',
                    }}
                  >
                    New
                  </button>
                </div>
                {/* Active Strategies */}
                <div style={{ marginBottom: 18 }}>
                  <div style={{ color: '#10B981', fontWeight: 600, fontSize: '0.98rem', marginBottom: 8 }}>Active Strategies</div>
                  <SubSectionCard delay={0.2} style={{ background: '#20294a' }}>
                    <div style={{ color: '#FFD700', fontWeight: 600, fontSize: '0.97rem', marginBottom: 4 }}>
                      Multi-thread Attention
                    </div>
                    <div style={{ color: '#aaa', fontSize: '0.88rem' }}>
                      Portfolios: <span style={{ color: '#00F5FF', fontWeight: 600 }}>Portfolio 1</span>
                    </div>
                  </SubSectionCard>
                  <SubSectionCard delay={0.25} style={{ background: '#20294a' }}>
                    <div style={{ color: '#FF69B4', fontWeight: 600, fontSize: '0.97rem', marginBottom: 4 }}>
                      Mean Reversion
                    </div>
                    <div style={{ color: '#aaa', fontSize: '0.88rem' }}>
                      Portfolios: <span style={{ color: '#00F5FF', fontWeight: 600 }}>Portfolio 2</span>
                    </div>
                  </SubSectionCard>
                </div>
                {/* Inactive Strategies */}
                <div>
                  <div style={{ color: '#aaa', fontWeight: 600, fontSize: '0.98rem', marginBottom: 8 }}>Inactive Strategies</div>
                  <SubSectionCard delay={0.3}>
                    <div style={{ color: '#666', fontWeight: 500, fontSize: '0.97rem', textAlign: 'center' }}>
                      No inactive strategies
                    </div>
                  </SubSectionCard>
                </div>
              </SectionCard>
            </div>
          </MainContent>
            </HomepageContainer>
          ) : currentPage === 'portfolio1' ? (
            <VirtualMarketMonitor 
              portfolioId={1}
              strategyName="Multi-thread Attention"
              onBack={() => setCurrentPage('main')}
            />
          ) : currentPage === 'portfolio2' ? (
            <VirtualMarketMonitor 
              portfolioId={2}
              strategyName="Mean Reversion"
              onBack={() => setCurrentPage('main')}
            />
          ) : null}
        </>
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
              <TabContentScrollContainer>
                <SlidingTabsContainer activeTab={activeTab}>
                  <SlidingTabsInner activeTab={activeTab}>
                    <SlidingTabContent>
                      <WalletsList>
                        <WalletOption 
                          expanded={showAccountSelection || (!!massaStationError && !isConnectingMassaStation)} 
                          onClick={handleConnectMassaStation} 
                          style={{ flexDirection: 'column', alignItems: 'stretch', paddingBottom: (showAccountSelection || (!!massaStationError && !isConnectingMassaStation)) ? 0 : undefined }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                            <WalletIcon>
                              <svg width="28" height="28" viewBox="0 0 48 48"><circle cx="24" cy="24" r="21" fill="#1AE19D" /></svg>
                            </WalletIcon>
                            <WalletInfo>
                              <WalletName>
                                {isConnectingMassaStation ? 'Connecting...' : 'Massa Station'}
                              </WalletName>
                              <WalletDesc>
                                {isConnectingMassaStation ? 'Please wait...' : 'Connect with Massa Station extension'}
                              </WalletDesc>
                            </WalletInfo>
                            <WalletArrow>
                              <img 
                                src={ExpandArrow} 
                                alt="expand" 
                                style={{ 
                                  width: '16px', 
                                  height: '16px',
                                  transform: (showAccountSelection || (!!massaStationError && !isConnectingMassaStation)) ? 'rotate(180deg)' : 'rotate(90deg)',
                                  transition: 'transform 0.2s ease',
                                  filter: 'invert(85%) sepia(100%) saturate(1000%) hue-rotate(180deg)'
                                }} 
                              />
                            </WalletArrow>
                          </div>
                          {(showAccountSelection || (!!massaStationError && !isConnectingMassaStation)) && (
                            <AccordionInputContainer onClick={e => e.stopPropagation()}>
                              {/* Error message only in expanded section */}
                              {massaStationError && !isConnectingMassaStation && (
                                <div style={{ 
                                  color: '#FFD700', 
                                  fontSize: '0.85rem', 
                                  marginTop: 4,
                                  width: '100%',
                                  overflowWrap: 'break-word',
                                  wordBreak: 'break-all',
                                  textOverflow: 'ellipsis',
                                  textAlign: 'left',
                                  whiteSpace: 'normal',
                                  background: 'rgba(255,255,0,0.05)',
                                  borderRadius: 4,
                                  padding: '4px 6px',
                                  marginBottom: 10,
                                  maxWidth: '100%'
                                }}>
                                  Error: {massaStationError}
                                </div>
                              )}
                              {/* Only show account selection UI if showAccountSelection is true and not showing error */}
                              {showAccountSelection && !massaStationError && (
                                <div style={{ 
                                  width: 'calc(100% - 40px)', 
                                  display: 'flex', 
                                  flexDirection: 'column', 
                                  alignItems: 'flex-start', 
                                  paddingBottom: '20px',
                                  maxWidth: 'calc(100% - 40px)',
                                  overflow: 'hidden',
                                  margin: '0 auto'
                                }}>
                                  <div style={{ 
                                    color: '#aaa', 
                                    fontSize: '0.9rem', 
                                    marginBottom: '12px',
                                    fontWeight: '500',
                                    textAlign: 'left',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    width: '100%'
                                  }}>
                                    <span>Select an account to connect:</span>
                                    <span style={{ 
                                      color: '#00F5FF', 
                                      fontWeight: '600'
                                    }}>
                                      {currentNetwork || ''}
                                    </span>
                                  </div>
                                  {availableAccounts.map((account, index) => {
                                    const address = account.address;
                                    const abbreviatedAddress = address.length > 9 
                                      ? `${address.substring(0, 6)}...${address.substring(address.length - 3)}`
                                      : address;
                                    
                                    return (
                                      <div
                                        key={account.address}
                                        onClick={() => handleSelectAccount(index)}
                                        style={{
                                          width: 'calc(100% - 34px)',
                                          padding: '8px 15px',
                                          marginBottom: '6px',
                                          backgroundColor: '#1a2337',
                                          borderRadius: '6px',
                                          cursor: 'pointer',
                                          border: '1px solid #232b4a',
                                          transition: 'all 0.2s ease',
                                          display: 'flex',
                                          justifyContent: 'space-between',
                                          alignItems: 'center',
                                          minHeight: '40px',
                                          overflow: 'auto'
                                        }}
                                        onMouseEnter={(e) => {
                                          e.currentTarget.style.backgroundColor = '#232b4a';
                                          e.currentTarget.style.borderColor = '#00F5FF';
                                        }}
                                        onMouseLeave={(e) => {
                                          e.currentTarget.style.backgroundColor = '#1a2337';
                                          e.currentTarget.style.borderColor = '#232b4a';
                                        }}
                                      >
                                        <div style={{ 
                                          display: 'flex',
                                          flexDirection: 'column',
                                          alignItems: 'flex-start',
                                          flex: 1,
                                          minWidth: 0,
                                          marginRight: '8px',
                                          overflow: 'hidden'
                                        }}>
                                          <div style={{ 
                                            color: '#fff', 
                                            fontSize: '0.85rem', 
                                            fontWeight: '500',
                                            marginBottom: '2px',
                                            whiteSpace: 'nowrap',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            maxWidth: '100%'
                                          }}>
                                            {account.name}
                                          </div>
                                          <div style={{ 
                                            color: '#aaa', 
                                            fontSize: '0.7rem',
                                            fontFamily: 'Monospace, monospace',
                                            whiteSpace: 'nowrap',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            maxWidth: '100%'
                                          }}>
                                            ({abbreviatedAddress})
                                          </div>
                                        </div>
                                        <div style={{ 
                                          color: '#00F5FF', 
                                          fontSize: '0.85rem',
                                          fontWeight: '500',
                                          whiteSpace: 'nowrap',
                                          flexShrink: 0
                                        }}>
                                          {parseFloat(account.balance || '0').toFixed(2)} MAS
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </AccordionInputContainer>
                          )}
                        </WalletOption>
                        <WalletOption expanded={showMassaInput} onClick={handleConnectMassaWallet} style={{ flexDirection: 'column', alignItems: 'stretch', paddingBottom: showMassaInput ? 0 : undefined }}>
                          <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                            <WalletIcon>
                            <svg width="25px" height="25px" viewBox="0 0 0.5 0.5"><path fill="#00F5FF" d="M0.25 0.039a0.063 0.063 0 0 0 -0.055 0.031L0.214 0.083 0.195 0.071 0.017 0.363a0.063 0.063 0 0 0 0.023 0.088q0.014 0.009 0.032 0.009h0.355A0.063 0.063 0 0 0 0.484 0.428a0.063 0.063 0 0 0 0 -0.065L0.306 0.071A0.063 0.063 0 0 0 0.25 0.039"/></svg>
                            </WalletIcon>
                                                    <WalletInfo>
                            <WalletName>
                              {isConnecting ? 'Connecting...' : 
                               (connectedWalletType === 'privateKey' && walletState.isConnected) ? 'Connected to Buildnet' : 'Massa Wallet'}
                            </WalletName>
                            <WalletDesc>
                              {isConnecting ? 'Please wait...' : 'Connect to buildnet with private key'}
                            </WalletDesc>
                            {(connectedWalletType === 'privateKey' && walletState.isConnected) && (
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
                                  style={{ marginBottom: 16, width: '100%', fontSize: '0.85rem' }}
                                />
                                {/* Error message only in expanded section */}
                                {massaWalletError && <div style={{ color: '#FFD700', marginBottom: 10, width: '100%', overflowWrap: 'break-word', wordBreak: 'break-all', whiteSpace: 'normal', background: 'rgba(255,255,0,0.05)', borderRadius: 4, padding: '4px 6px', fontSize: '0.85rem' }}>{massaWalletError}</div>}
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
                          <WalletOption expanded={showLedgerInput} onClick={handleConnectLedgerWallet} style={{ flexDirection: 'column', alignItems: 'stretch', paddingBottom: showLedgerInput ? 0 : undefined }}>
                            <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                          <WalletIcon>
                            <svg width="28" height="28" viewBox="0 0 48 48"><rect x="8" y="8" width="35" height="35" rx="8" fill="#FFD700" /></svg>
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
                                    COMING SOON
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
                              Social and Email login will be available in a future update.
                            </div>
                          </ComingSoonOverlay>
                        </LoginTabContent>
                      </SlidingTabContent>
                  </SlidingTabsInner>
                </SlidingTabsContainer>
              </TabContentScrollContainer>
            </ModalPanel>
          </ModalBackdrop>
        )}
      </PageContainer>
      )}
    </>
  );
}

export default App;
