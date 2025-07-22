// Global state management
let currentUser = JSON.parse(sessionStorage.getItem("current_user_wallet")) || null;
const allPurchases = []
let allUsersData = []
let bonusCountdownInterval
let tweetMissionListenersAttached = false

// Web3 Global Variables
let web3Modal;
let web3Provider;
let signer;
let currentConnectedWalletAddress;
let userHasNft = false;

// Constants
const BACKEND_URL = "https://blackbyte-backend.onrender.com"; // CHANGE THIS FOR LOCAL TESTING, use "https://blackbyte-backend.onrender.com" for production

// NFT Contract Configurations
const NFT_CONTRACT_ADDRESS = "0x669c46bdf06e111685fd58b271fb3a6a02423274"; // YOUR NFT CONTRACT ADDRESS
const REQUIRED_CHAIN_ID = 33139; // ApeChain Mainnet Chain ID (replace with actual if different)

// Alchemy API Key and Base URL
const ALCHEMY_API_KEY = "GecgOCM9PL3EQHXNxnWMg"; // Your Alchemy API key
const ALCHEMY_BASE_URL = "https://apechain-mainnet.g.alchemy.com/v2/";

const NFT_CONTRACT_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
];

// DOM Elements - Initialized after DOM is loaded
let elements = {}

// Utility Functions
function initializeElements() {
  elements = {
    // Modals
    purchaseModal: document.getElementById("purchase-modal"),
    shareModal: document.getElementById("share-modal"),
    myAccountModal: document.getElementById("my-account-modal"),
    adminPanel: document.getElementById("admin-panel"),
    updateInfoModal: document.getElementById("update-info-modal"),
    walletModal: document.getElementById("wallet-modal"),
    wrongChainModal: document.getElementById("wrong-chain-modal"),

    // Buttons
    connectWalletButton: document.getElementById("connect-wallet-button"),
    spinBtn: document.getElementById("spin-btn"),
    dailyBonusBtn: document.getElementById("daily-bonus-btn"),
    jackpotBuyBtn: document.getElementById("jackpot-buy-btn"),

    // Displays
    pointsCounter: document.getElementById("points-counter"),
    bonusTimer: document.getElementById("bonus-timer"),
    jackpotPot: document.getElementById("jackpot-pot"),
    userJackpotEntries: document.getElementById("user-jackpot-entries"),

    // Containers
    tweetMissionsContainer: document.getElementById("tweet-missions-container"),
    activeRafflesContainer: document.getElementById("active-raffles-container"),
    finishedRafflesContainer: document.getElementById("finished-raffles-container"),
    leaderboardList: document.getElementById("leaderboard-list"),

    // Tab contents
    tabContents: document.querySelectorAll(".tab-content"),

    // Utilities
    utilitiesSidebar: document.getElementById("utilities-sidebar"),
    utilitiesBtn: document.getElementById("utilities-btn"),

    // User interface
    walletInfo: document.getElementById("wallet-info"),
    connectedWalletAddress: document.getElementById("connected-wallet-address"),
    userAvatar: document.getElementById("user-avatar"),

    // User Account
    accountUsername: document.getElementById("account-username"),
    editUsernameBtn: document.getElementById("edit-username-btn"),
    usernameEditContainer: document.getElementById("username-edit-container"),
    editUsernameInput: document.getElementById("edit-username-input"),
    saveUsernameBtn: document.getElementById("save-username-btn"),
    cancelUsernameBtn: document.getElementById("cancel-username-btn"),

    // Staking Elements
    walletNftsContainer: document.getElementById("wallet-nfts-container"),
    stakedNftsContainer: document.getElementById("staked-nfts-container"),
    accumulatedRewardsDisplay: document.getElementById("accumulated-rewards-display"),
    claimAllRewardsBtn: document.getElementById("claim-all-rewards-btn"),

    // Auction Elements
    activeAuctionsContainer: document.getElementById("active-auctions-container"),
    endedAuctionsContainer: document.getElementById("ended-auctions-container"),

    // Admin Auction inputs (CORRECTED IDs)
    auctionName: document.getElementById("auction-name"),
    auctionImageUrl: document.getElementById("auction-image-url"),
    auctionTokenId: document.getElementById("auction-token-id"), // Corrected ID (was auction-nft-address before)
    auctionDuration: document.getElementById("auction-duration"),
    auctionMinBid: document.getElementById("auction-min-bid"),
    createAuctionBtn: document.getElementById("create-auction-btn"),
  }
}

function showNotification(message, type = "info") {
  const notification = document.createElement("div")
  notification.className = `fixed top-5 right-5 p-4 border rounded-lg shadow-lg z-[9999] text-white text-sm transition-all duration-300`
  notification.style.backgroundColor = "var(--blackbyte-gray)"
  notification.style.borderColor = "var(--blackbyte-border-gray)"

  if (type === "success") {
    notification.style.borderColor = "#4ade80"
    notification.style.color = "#4ade80"
  } else if (type === "error") {
    notification.style.borderColor = "var(--blackbyte-red)"
    notification.style.color = "#f87171"
  }

  notification.textContent = message
  document.body.appendChild(notification)

  setTimeout(() => {
    notification.style.transform = "translateX(0)"
    notification.style.opacity = "1"
  }, 100)

  setTimeout(() => {
    notification.style.opacity = "0"
    notification.style.transform = "translateX(100%)"
    setTimeout(() => {
      if (document.body.contains(notification)) {
        document.body.removeChild(notification)
      }
    }, 300)
  }, 3500)
}

function showLoginFirstMessage() {
  const msg = document.createElement("div")
  msg.className = "login-first-msg"
  msg.textContent = "Connect wallet first."
  document.body.appendChild(msg)

  setTimeout(() => msg.classList.add("fade-out"), 2000)
  msg.addEventListener("transitionend", () => {
    if (document.body.contains(msg)) {
      msg.remove()
    }
  })
}

// Modal Management
function showModal(modalElement) {
  if (modalElement) {
    modalElement.style.display = "block";
    document.body.classList.add("modal-open");
    setTimeout(() => {
      modalElement.style.opacity = "1";
    }, 10);
  }
}

function hideModal(modalElement) {
  if (modalElement) {
    modalElement.style.opacity = "0";
    setTimeout(() => {
      modalElement.style.display = "none";
      document.body.classList.remove("modal-open");
    }, 200);
  }
}

function showWrongChainModal() {
  if (elements.wrongChainModal) {
    elements.wrongChainModal.style.display = "flex";
    document.body.classList.add("modal-open");
    setTimeout(() => {
      elements.wrongChainModal.style.opacity = "1";
    }, 10);
  }
}

function hideWrongChainModal() {
  if (elements.wrongChainModal) {
    elements.wrongChainModal.style.opacity = "0";
    setTimeout(() => {
      elements.wrongChainModal.style.display = "none";
      document.body.classList.remove("modal-open");
    }, 200);
  }
}

// Tab Management
function activateTab(tabId) {
  elements.tabContents.forEach((content) => content.classList.remove("active"))

  const targetTab = document.getElementById(tabId)
  if (targetTab) {
    targetTab.classList.add("active")
  }

  handleTabContent(tabId)
}

function handleTabContent(tabId) {
  const contentMappings = {
    casino: {
      content: "game-content",
      prompt: "login-prompt"
    },
    shop: {
      content: "shop-content",
      prompt: "shop-login-prompt"
    },
    "earn-twitter": {
      content: "earn-twitter-content",
      prompt: "earn-twitter-login-prompt"
    },
    raffles: {
      content: "raffle-content",
      prompt: "raffle-login-prompt"
    },
    leaderboard: {
      content: "leaderboard-content",
      prompt: "leaderboard-login-prompt"
    },
    staking: {
      content: "staking-content",
      prompt: "staking-login-prompt"
    },
    auctions: { // NEW: Auctions Tab
      content: "auctions-content",
      prompt: "auctions-login-prompt"
    },
  }

  const mapping = contentMappings[tabId]
  if (!mapping) return

  const contentEl = document.getElementById(mapping.content)
  const promptEl = document.getElementById(mapping.prompt)

  if (currentUser && currentUser.walletAddress && userHasNft) {
    if (contentEl) contentEl.classList.remove("hidden")
    if (promptEl) promptEl.classList.add("hidden")

    switch (tabId) {
      case "earn-twitter":
        renderTweetMissions()
        break
      case "raffles":
        loadRaffles()
        break
      case "leaderboard":
        loadLeaderboard()
        break
      case "staking":
        renderStakingDashboard();
        break;
      case "auctions": // NEW: Load Auctions
        loadAuctions();
        break;
    }
  } else {
    if (contentEl) contentEl.classList.add("hidden")
    if (promptEl) promptEl.classList.remove("hidden")
    if (currentUser && currentUser.walletAddress && !userHasNft) {
      if (promptEl) promptEl.querySelector('p').textContent = "You need a BlackByte NFT in your wallet to access this section.";
      if (promptEl) {
        const authButton = promptEl.querySelector('button');
        if (authButton) {
          authButton.textContent = "Learn more about BlackByte NFTs";
        }
      }
    }
  }
}

async function loadRecentJackpotWins() {
  const homepageContainer = document.getElementById("homepage-recent-jackpot-wins")
  const casinoContainer = document.getElementById("recent-jackpot-wins")

  if (!homepageContainer && !casinoContainer) return

  try {
    const response = await fetch(`${BACKEND_URL}/recent-wins`)
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const allWins = await response.json()

    const jackpotWins = allWins.filter((win) => win.type === "jackpot")

    if (homepageContainer) {
      renderJackpotWinsForHomepage(jackpotWins, homepageContainer)
    }

    if (casinoContainer) {
      renderJackpotWinsForCasino(jackpotWins, casinoContainer)
    }
  } catch (error) {
    console.error("Error loading recent jackpot wins:", error)

    if (homepageContainer) {
      homepageContainer.innerHTML = '<p class="text-red-400 col-span-full">Error loading recent jackpot winners.</p>'
    }

    if (casinoContainer) {
      casinoContainer.innerHTML = '<p class="text-red-400">Error loading recent jackpot winners.</p>'
    }
  }
}

async function getUserNftsInWallet(walletAddress) {
  if (!walletAddress) {
    console.warn("Wallet address missing for fetching NFTs.");
    return [];
  }

  try {
    const network = await web3Provider.getNetwork();
    const chainId = network.chainId;

    if (chainId !== REQUIRED_CHAIN_ID) {
      showWrongChainModal();
      return [];
    } else {
      hideWrongChainModal();
    }

    const nftContract = new ethers.Contract(NFT_CONTRACT_ADDRESS, NFT_CONTRACT_ABI, web3Provider);

    const balance = await nftContract.balanceOf(currentConnectedWalletAddress);
    const nftCount = balance.toNumber();

    console.log(`NFT Balance for ${currentConnectedWalletAddress}: ${nftCount}`);

    // Alchemy API to get NFT details
    const url = `${ALCHEMY_BASE_URL}${ALCHEMY_API_KEY}/getNFTsForOwner/?owner=${walletAddress}&contractAddresses[]=${NFT_CONTRACT_ADDRESS}`;
    console.log("Fetching NFTs from Alchemy URL:", url);

    const response = await fetch(url, { method: "GET" });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
      throw new Error(`Alchemy API error! status: ${response.status}, message: ${errorData.message || response.statusText}`);
    }

    const data = await response.json();
    console.log("NFTs from Alchemy:", data);

    const userNfts = data.ownedNfts.map(nft => {
      const tokenId = parseInt(nft.id.tokenId, 16).toString();
      const imageUrl = nft.media.length > 0 && nft.media[0].gateway ? nft.media[0].gateway : "nft-placeholder.png";
      return {
        tokenId: tokenId,
        isStaked: false,
        imageUrl: imageUrl
      };
    });

    return userNfts;

  } catch (error) {
    console.error("DETAILED ERROR fetching user NFTs with Alchemy:", error);
    showNotification("Error loading your NFTs. Please ensure your wallet is on the correct network and try again.", "error");
    return [];
  }
}

function renderJackpotWinsForHomepage(jackpotWins, container) {
  container.innerHTML = ""

  if (jackpotWins.length === 0) {
    container.innerHTML = `
      <div class="col-span-full text-center py-8">
        <i class="fas fa-trophy text-4xl text-gray-600 mb-4"></i>
        <p class="text-gray-400">No jackpot winners yet today.</p>
        <p class="text-sm text-gray-500 mt-2">Daily jackpot draws at 17:00 UTC</p>
      </div>
    `
    return
  }

  const recentJackpotWins = jackpotWins.slice(0, 3)

  recentJackpotWins.forEach((win, index) => {
    const winCard = document.createElement("div")
    winCard.className = "bg-blackbyte-gray rounded-lg border border-gray-800 p-6 card-hover"

    const timeAgo = getTimeAgo(new Date(win.timestamp))

    winCard.innerHTML = `
      <div class="flex items-center justify-between mb-4">
        <div class="flex items-center space-x-3">
          <div class="w-12 h-12 rounded-full bg-gradient-to-r from-yellow-400 to-yellow-600 flex items-center justify-center">
            <i class="fas fa-crown text-white text-lg"></i>
          </div>
          <div>
            <h4 class="text-lg font-semibold text-white">${win.username}</h4>
            <p class="text-sm text-gray-400">Jackpot Winner</p>
          </div>
        </div>
        <div class="text-right">
          <p class="text-2xl font-bold text-yellow-400">${win.amount.toLocaleString()}</p>
          <p class="text-xs text-gray-500">$BB</p>
        </div>
      </div>
      
      <div class="flex justify-between items-center text-sm">
        <div>
          <p class="text-gray-400">Prize Type</p>
          <p class="text-blackbyte-red font-semibold">DAILY JACKPOT</p>
        </div>
        <div class="text-right">
          <p class="text-gray-400">Won</p>
          <p class="text-white">${timeAgo}</p>
        </div>
      </div>
    `

    container.appendChild(winCard)
  })
}

function renderJackpotWinsForCasino(jackpotWins, container) {
  container.innerHTML = ""

  if (jackpotWins.length === 0) {
    container.innerHTML = `
      <div class="col-span-full text-center py-6">
        <i class="fas fa-trophy text-3xl text-gray-600 mb-3"></i>
        <p class="text-gray-400">No recent jackpot winners.</p>
        <p class="text-sm text-gray-500 mt-1">Be the first to win today!</p>
      </div>
    `
    return
  }

  const recentJackpotWins = jackpotWins.slice(0, 6)

  recentJackpotWins.forEach((win) => {
    const winCard = document.createElement("div")
    winCard.className = "bb-card p-4"

    const timeAgo = getTimeAgo(new Date(win.timestamp))

    winCard.innerHTML = `
      <div class="flex items-center space-x-3 mb-3">
        <div class="w-10 h-10 rounded-full bg-gradient-to-r from-yellow-400 to-yellow-600 flex items-center justify-center flex-shrink-0">
          <i class="fas fa-crown text-white text-sm"></i>
        </div>
        <div class="min-w-0 flex-1">
          <h4 class="text-white font-semibold truncate">${win.username}</h4>
          <p class="text-xs text-gray-400">Jackpot Winner</p>
        </div>
      </div>
      
      <div class="text-center">
        <p class="text-xl font-bold text-yellow-400 mb-1">${win.amount.toLocaleString()}</p>
        <p class="text-xs text-gray-500 mb-2">$BB</p>
        <p class="text-xs text-gray-400">${timeAgo}</p>
      </div>
    `

    container.appendChild(winCard)
  })
}

function getTimeAgo(date) {
  const now = new Date()
  const diffInSeconds = Math.floor((now - date) / 1000)

  if (diffInSeconds < 60) {
    return "Just now"
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60)
    return `${minutes}m ago`
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600)
    return `${hours}h ago`
  } else {
    const days = Math.floor(diffInSeconds / 86400)
    return `${days}d ago`
  }
}

// Slot Machine Functions
function startSlotSpin() {
  const reels = [document.getElementById("reel1"), document.getElementById("reel2"), document.getElementById("reel3")]

  reels.forEach((reel) => {
    if (reel) {
      reel.classList.add("spinning")
    }
  })

  return reels
}

function stopSlotSpin(reels, results) {
  return new Promise((resolve) => {
    setTimeout(
      () => {
        if (reels[0]) {
          reels[0].classList.remove("spinning")
          reels[0].textContent = results[0]
        }

        setTimeout(
          () => {
            if (reels[1]) {
              reels[1].classList.remove("spinning")
              reels[1].textContent = results[1]
            }

            setTimeout(
              () => {
                if (reels[2]) {
                  reels[2].classList.remove("spinning")
                  reels[2].textContent = results[2]
                }
                resolve()
              },
              300 + Math.random() * 200,
            )
          },
          300 + Math.random() * 200,
        )
      },
      500 + Math.random() * 500,
    )
  })
}

// API Functions
async function apiRequest(url, options = {}) {
  try {
    const headers = {
      "Content-Type": "application/json",
      ...options.headers,
    };
    if (currentUser && currentUser.walletAddress) {
      headers['X-Wallet-Address'] = currentUser.walletAddress;
    }

    const response = await fetch(url, {
      headers: headers,
      ...options,
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({
        message: 'Unknown error'
      }));
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorData.message || response.statusText}`);
    }

    return await response.json()
  } catch (error) {
    console.error("API request failed:", error)
    throw error
  }
}

// User Management
function updateUserUI() {
  if (currentUser && currentUser.walletAddress) {
    if (elements.connectWalletButton) elements.connectWalletButton.classList.add("hidden");
    if (elements.walletInfo) elements.walletInfo.classList.remove("hidden");

    if (elements.pointsCounter) {
      elements.pointsCounter.textContent = currentUser.credits.toLocaleString() + " $BB";
    }
    if (elements.connectedWalletAddress) {
      const address = currentUser.walletAddress;
      elements.connectedWalletAddress.textContent = `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
    }

    if (elements.userAvatar) {
      elements.userAvatar.innerHTML = `<span class="font-bold text-white text-lg">W</span>`
      elements.userAvatar.setAttribute("title", `Connected: ${currentUser.username || currentUser.walletAddress}`)
    }

    const totalWinsEl = document.getElementById("total-wins")
    const totalEarnedEl = document.getElementById("total-earned")
    const hotStreakEl = document.getElementById("hot-streak")

    if (totalWinsEl && currentUser.stats) totalWinsEl.textContent = currentUser.stats.wins || 0
    if (totalEarnedEl && currentUser.stats)
      totalEarnedEl.textContent = `${(currentUser.stats.earned || 0).toLocaleString()} $BB`
    if (hotStreakEl && currentUser.stats) hotStreakEl.textContent = `${currentUser.stats.streak || 0} WINS`

    updateDailyBonusStatus()

    updateShopButtons()

    updateUtilityItemsVisibility()
  } else {
    if (elements.connectWalletButton) elements.connectWalletButton.classList.remove("hidden");
    if (elements.walletInfo) elements.walletInfo.classList.add("hidden");

    updateUtilityItemsVisibility()
  }
}

async function checkNftOwnership() {
  if (!web3Provider || !currentConnectedWalletAddress) {
    console.warn("Wallet not connected or address missing for NFT check.");
    hideWrongChainModal();
    return false;
  }

  try {
    const network = await web3Provider.getNetwork();
    const chainId = network.chainId;

    if (chainId !== REQUIRED_CHAIN_ID) {
      showWrongChainModal();
      return false;
    } else {
      hideWrongChainModal();
    }

    const nftContract = new ethers.Contract(NFT_CONTRACT_ADDRESS, NFT_CONTRACT_ABI, web3Provider);

    const balance = await nftContract.balanceOf(currentConnectedWalletAddress);
    const nftCount = balance.toNumber();

    console.log(`NFT Balance for ${currentConnectedWalletAddress}: ${nftCount}`);

    if (nftCount > 0) {
      return true;
    } else {
      return false;
    }
  } catch (error) {
    console.error("Error checking NFT ownership:", error);
    hideWrongChainModal();
    showNotification("Error verifying NFT ownership. Please try again.", "error");
    return false;
  }
}

function updateShopButtons() {
  const buttons = [{
    btn: "gtd-wl-btn",
    tag: "gtd-purchased-tag",
    type: "GTD"
  }, {
    btn: "fcfs-wl-btn",
    tag: "fcfs-purchased-tag",
    type: "FCFS"
  }, {
    btn: "blackbyte-free-btn",
    tag: "blackbyte-free-purchased-tag",
    type: "BLACKBYTEFREE"
  }, ]

  buttons.forEach(({
    btn,
    tag,
    type
  }) => {
    const buttonEl = document.getElementById(btn)
    const tagEl = document.getElementById(tag)

    if (buttonEl && tagEl) {
      const purchased = currentUser?.purchases?.map((p) => p.toUpperCase()).includes(type)
      buttonEl.disabled = purchased
      tagEl.textContent = purchased ? "PURCHASED" : "PURCHASE"
    }
  })
}

function updateUtilityItemsVisibility() {
  const myAccountItem = document.getElementById("util-my-account-item")
  const adminItem = document.getElementById("util-admin-item")

  if (myAccountItem) {
    myAccountItem.style.display = currentUser && currentUser.walletAddress ? "block" : "none"
  }

  if (adminItem) {
    adminItem.style.display = currentUser && currentUser.isAdmin ? "block" : "none"
  }
}

// Daily Bonus Functions
function updateDailyBonusStatus() {
  if (!currentUser || !elements.dailyBonusBtn || !elements.bonusTimer) return

  apiRequest(`${BACKEND_URL}/bonus/status/${currentUser._id}`)
    .then((data) => {
      if (data.eligible) {
        elements.dailyBonusBtn.disabled = false
        elements.dailyBonusBtn.textContent = "CLAIM 25 $BB"
        elements.bonusTimer.textContent = "READY!"
        elements.dailyBonusBtn.classList.remove("bb-btn-secondary", "opacity-50")
        elements.dailyBonusBtn.classList.add("bb-btn-primary")
      } else {
        elements.dailyBonusBtn.disabled = true
        elements.dailyBonusBtn.textContent = "ALREADY CLAIMED"
        elements.dailyBonusBtn.classList.remove("bb-btn-primary")
        elements.dailyBonusBtn.classList.add("bb-btn-secondary", "opacity-50")

        const lastBonusTime = currentUser.lastBonus ? new Date(currentUser.lastBonus).getTime() : 0
        const msLeft = 24 * 60 * 60 * 1000 - (Date.now() - lastBonusTime)
        if (msLeft > 0) {
          startBonusCountdown(Math.floor(msLeft / 1000))
        } else {
          elements.bonusTimer.textContent = "Processing..."
        }
      }
    })
    .catch((err) => console.error("Error updating daily bonus status", err))
}

function startBonusCountdown(seconds) {
  if (bonusCountdownInterval) clearInterval(bonusCountdownInterval)
  if (!elements.bonusTimer) return

  let remaining = seconds

  const updateTimerDisplay = () => {
    const hrs = String(Math.floor(remaining / 3600)).padStart(2, "0")
    const mins = String(Math.floor((remaining % 3600) / 60)).padStart(2, "0")
    const secs = String(remaining % 60).padStart(2, "0")
    elements.bonusTimer.textContent = `${hrs}:${mins}:${secs}`
  }

  updateTimerDisplay()

  bonusCountdownInterval = setInterval(() => {
    remaining--
    if (remaining <= 0) {
      clearInterval(bonusCountdownInterval)
      elements.bonusTimer.textContent = "READY!"
      if (elements.dailyBonusBtn) {
        elements.dailyBonusBtn.disabled = false
        elements.dailyBonusBtn.textContent = "CLAIM 1.000 $BB"
        elements.dailyBonusBtn.classList.remove("bb-btn-secondary", "opacity-50")
        elements.dailyBonusBtn.classList.add("bb-btn-primary")
      }
    } else {
      updateTimerDisplay()
    }
  }, 1000)
}

// Jackpot Functions
function updateJackpotPot() {
  apiRequest(`${BACKEND_URL}/jackpot/pot`)
    .then((data) => {
      if (elements.jackpotPot) {
        elements.jackpotPot.textContent = `${(data.pot || 0).toLocaleString()} $BB`
      }
    })
    .catch((err) => {
      console.error("Error fetching jackpot pot:", err)
      if (elements.jackpotPot) elements.jackpotPot.textContent = "Error"
    })
}

function updateUserJackpotEntries() {
  if (!elements.userJackpotEntries) return

  if (!currentUser || !currentUser._id) {
    elements.userJackpotEntries.textContent = "Connect wallet to see entries."
    return
  }

  apiRequest(`${BACKEND_URL}/jackpot/entries/${currentUser._id}`)
    .then((data) => {
      elements.userJackpotEntries.textContent = `You have ${data.count} entr${data.count === 1 ? "y" : "ies"} today`
    })
    .catch((err) => {
      console.error("Error fetching user entries:", err)
      elements.userJackpotEntries.textContent = "Error loading entries."
    })
}

// Twitter Missions
async function renderTweetMissions() {
  if (!currentUser || !elements.tweetMissionsContainer) return

  elements.tweetMissionsContainer.innerHTML = '<p class="text-gray-400">Loading tweet missions...</p>'

  try {
    const missions = await apiRequest(`${BACKEND_URL}/twitter/missions`)
    elements.tweetMissionsContainer.innerHTML = ""

    if (missions.length === 0) {
      elements.tweetMissionsContainer.innerHTML =
        '<p class="text-gray-400">No active Twitter missions. Check back later!</p>'
      return
    }

    missions.forEach((mission) => {
      const isClaimed = currentUser.claimedTweets?.includes(mission._id)
      const stockInfo = mission.totalStock ?
        `(${mission.claimingUsers?.length || 0}/${mission.totalStock})` :
        "(Unlimited)"
      const isStockOut = mission.totalStock !== null && (mission.claimingUsers?.length || 0) >= mission.totalStock

      let buttonText = "INTERACT & WAIT"
      let buttonClasses = "bb-btn-secondary opacity-50"
      const buttonDisabled = true

      if (isClaimed) {
        buttonText = "CLAIMED"
        buttonClasses = "bb-btn-secondary opacity-50"
      } else if (isStockOut) {
        buttonText = "MISSION ENDED"
        buttonClasses = "bb-btn-secondary opacity-50"
      }

      const card = document.createElement("div")
      card.className = "bb-card p-4 flex flex-col justify-between"
      card.innerHTML = `
                <div>
                    <h3 class="text-lg font-orbitron text-white mb-2">${mission.missionText}</h3>
                    <p class="text-xs text-gray-400 mb-1">Reward: <span class="font-bold text-green-400">${mission.rewardPoints} $BB</span></p>
                    <p class="text-xs text-gray-500 mb-3">Stock: <span class="font-bold ${isStockOut ? "text-red-500" : "text-yellow-400"}">${stockInfo}</span></p>
                    <div class="tweet-embed-container mb-3" id="tweet-embed-${mission._id}">
                        ${
                          mission.isVideoLink
                            ? '<div class="video-mission-placeholder w-full h-full flex items-center justify-center"><p class="bg-blackbyte-dark p-2 rounded text-sm">Video: Click "GO TO TWEET"</p></div>'
                            : '<p class="text-xs text-gray-500 p-2">Loading Tweet...</p>'
                        }
                    </div>
                </div>
                <div class="mt-auto space-y-2">
                    <button class="bb-btn bg-blue-500 hover:bg-blue-600 text-white w-full py-2 text-sm go-to-tweet-btn" data-url="${mission.tweetUrl}" data-mission-id="${mission._id}" ${isClaimed || isStockOut ? "disabled" : ""}>
                        GO TO TWEET <i class="fab fa-twitter ml-1"></i>
                    </button>
                    <button class="w-full py-2 text-sm claim-points-btn ${buttonClasses}" data-mission-id="${mission._id}" data-reward="${mission.rewardPoints}" ${buttonDisabled ? "disabled" : ""}>
                        ${buttonText}
                    </button>
                </div>
            `
      elements.tweetMissionsContainer.appendChild(card)

      if (!mission.isVideoLink) {
        loadTweetEmbed(mission._id, mission.tweetUrl)
      }
    })
  } catch (error) {
    console.error("Error rendering tweet missions:", error)
    elements.tweetMissionsContainer.innerHTML = `<p class="text-red-400">Error: ${error.message}</p>`
  }
}

function loadTweetEmbed(missionId, tweetUrl) {
  const embedContainer = document.getElementById(`tweet-embed-${missionId}`)
  if (!embedContainer) return

  if (typeof twttr !== "undefined" && twttr.widgets) {
    const tweetIdMatch = tweetUrl.match(/\/status\/(\d+)/)
    if (tweetIdMatch && tweetIdMatch[1]) {
      twttr.widgets
        .createTweet(tweetIdMatch[1], embedContainer, {
          theme: "dark",
          cards: "hidden",
          conversation: "none",
          width: "auto",
          dnt: true,
        })
        .then((el) => {
          if (el) {
            const p = embedContainer.querySelector("p")
            if (p) p.remove()
          } else {
            embedContainer.innerHTML = '<p class="text-xs text-red-400 p-2">Tweet could not display.</p>'
          }
        })
        .catch((err) => {
          console.error("Tweet embed error:", err)
          embedContainer.innerHTML = '<p class="text-xs text-red-400 p-2">Error loading Tweet.</p>'
        })
    } else {
      embedContainer.innerHTML = '<p class="text-xs text-red-400 p-2">Invalid Tweet URL.</p>'
    }
  } else {
    embedContainer.innerHTML = '<p class="text-xs text-yellow-400 p-2">Twitter widget loading...</p>'
  }
}

// Raffles Functions
async function loadRaffles() {
  if (!currentUser || !elements.activeRafflesContainer || !elements.finishedRafflesContainer) return

  elements.activeRafflesContainer.innerHTML = '<p class="text-gray-400">Loading active raffles...</p>'
  elements.finishedRafflesContainer.innerHTML = '<p class="text-gray-400">Loading finished raffles...</p>'

  try {
    const [activeResp, finishedResp] = await Promise.all([
      fetch(`${BACKEND_URL}/raffles/active`),
      fetch(`${BACKEND_URL}/raffles/finished`),
    ])

    if (!activeResp.ok || !finishedResp.ok) {
      throw new Error(`HTTP error! status: ${activeResp.status} / ${finishedResp.status}`)
    }

    const activeRaffles = await activeResp.json()
    const finishedRaffles = await finishedResp.json()

    renderActiveRaffles(activeRaffles)
    renderFinishedRaffles(finishedRaffles)
  } catch (error) {
    console.error("Error loading raffles:", error)
    elements.activeRafflesContainer.innerHTML =
      '<p class="text-red-400">Error loading raffles. Please try again later.</p>'
    elements.finishedRafflesContainer.innerHTML = ""
  }
}

function renderActiveRaffles(raffles) {
  elements.activeRafflesContainer.innerHTML = ""

  if (raffles.length === 0) {
    elements.activeRafflesContainer.innerHTML =
      '<p class="text-gray-400 col-span-full">No active raffles at the moment. Check back later!</p>'
    return
  }

  raffles.forEach((raffle) => {
    const userTickets = raffle.participants.find((p) => p.userId === currentUser._id)?.ticketsBought || 0
    const totalSoldTickets = raffle.participants.reduce((sum, p) => sum + p.ticketsBought, 0)
    const percentageChance = totalSoldTickets > 0 ? ((userTickets / totalSoldTickets) * 100).toFixed(2) : 0
    const timeLeft = new Date(raffle.drawTime).getTime() - Date.now()
    const raffleEnded = timeLeft <= 0

    const raffleCard = createRaffleCard(raffle, userTickets, percentageChance, timeLeft, raffleEnded, totalSoldTickets)
    elements.activeRafflesContainer.appendChild(raffleCard)

    if (!raffleEnded) {
      const timerElement = document.getElementById(`raffle-timer-${raffle._id}`)
      startRaffleCountdown(raffle.drawTime, timerElement, raffle._id)
    }
  })
}

function renderFinishedRaffles(raffles) {
  elements.finishedRafflesContainer.innerHTML = ""

  if (raffles.length === 0) {
    elements.finishedRafflesContainer.innerHTML = '<p class="text-gray-400 col-span-full">No finished raffles yet.</p>'
    return
  }

  raffles.forEach((raffle) => {
    const raffleCard = document.createElement("div")
    raffleCard.className = "bb-card p-6 flex flex-col opacity-75"
    raffleCard.innerHTML = `
            <div class="raffle-image-wrapper">
                <img src="${raffle.imageUrl}" alt="${raffle.name}" class="w-full h-full object-cover">
            </div>
            <h3 class="text-xl font-orbitron text-white mb-2">${raffle.name}</h3>
            <p class="text-sm text-gray-400 mb-3">${raffle.description}</p>
            <div class="text-xs text-gray-500 mt-2 text-center mb-4">
                <span class="text-blackbyte-red">RAFFLE ENDED</span>
            </div>
            <div class="text-center mt-auto">
                ${
                  raffle.winners && raffle.winners.length > 0
                    ? `<p class="text-green-400 font-bold text-lg">WINNER: ${raffle.winners[0].username}!</p>
                       <p class="text-gray-500 text-sm break-all">${raffle.winners[0].walletAddress || "Wallet not provided"}</p>`
                    : `<p class="text-yellow-400 font-bold text-lg">Winner will be announced soon!</p>`
                }
            </div>
        `
    elements.finishedRafflesContainer.appendChild(raffleCard)
  })
}

function createRaffleCard(raffle, userTickets, percentageChance, timeLeft, raffleEnded, totalSoldTickets) {
  let timeDisplay = "";
  if (raffleEnded) {
    timeDisplay = '<span class="text-blackbyte-red">RAFFLE ENDED</span>';
  } else {
    const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
    const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);
    timeDisplay = `${days}d ${hours}h ${minutes}m ${seconds}s`;
  }

  const raffleCard = document.createElement("div")
  raffleCard.className = "bb-card p-6 flex flex-col"
  raffleCard.innerHTML = `
        <div class="raffle-image-wrapper">
            <img src="${raffle.imageUrl}" alt="${raffle.name}" class="w-full h-full object-cover">
        </div>
        <h3 class="text-xl font-orbitron text-white mb-2">${raffle.name}</h3>
        <p class="text-sm text-gray-400 mb-3">${raffle.description}</p>
        <div class="flex justify-between items-center text-sm mb-2">
            <span>Tickets Available:</span>
            <span class="font-bold text-blackbyte-red">${raffle.totalTickets - totalSoldTickets} / ${raffle.totalTickets}</span>
        </div>
        <div class="flex justify-between items-center text-sm mb-2">
            <span>Ticket Price:</span>
            <span class="font-bold text-green-400">${raffle.ticketPrice} $BB</span>
        </div>
        <div class="flex justify-between items-center text-sm mb-2">
            <span>Your Tickets:</span>
            <span class="font-bold text-white">${userTickets}</span>
        </div>
        <div class="flex justify-between items-center text-sm mb-3">
            <span>Your Win Chance:</span>
            <span class="font-bold text-yellow-400">${percentageChance}%</span>
        </div>
        <div class="text-xs text-gray-500 mt-2 text-center mb-4">
            Draws in: <span class="font-orbitron text-blackbyte-red" id="raffle-timer-${raffle._id}">${timeDisplay}</span>
        </div>
        <input type="text" id="raffle-wallet-input-${raffle._id}" placeholder="Enter your wallet address (0x...)" class="bb-input mt-3 mb-2">
        <button id="buy-raffle-ticket-${raffle._id}" class="bb-btn bb-btn-primary w-full py-2 mt-auto" ${raffleEnded || (raffle.totalTickets - totalSoldTickets <= 0) ? "disabled" : ""}>
            BUY TICKET (${raffle.ticketPrice} $BB)
        </button>
    `
  const walletInput = raffleCard.querySelector(`#raffle-wallet-input-${raffle._id}`);
  if (walletInput && currentConnectedWalletAddress) {
    walletInput.value = currentConnectedWalletAddress;
    walletInput.readOnly = true;
    walletInput.classList.add('opacity-75', 'cursor-not-allowed');
  }
  const buyButton = raffleCard.querySelector(`#buy-raffle-ticket-${raffle._id}`)
  if (buyButton) {
    buyButton.addEventListener("click", () =>
      buyRaffleTicket(raffle._id, raffle.ticketPrice, raffle.totalTickets - totalSoldTickets, buyButton),
    )
  }

  return raffleCard
}

function startRaffleCountdown(drawTime, timerElement, raffleId) {
  const interval = setInterval(() => {
    const now = new Date().getTime()
    const distance = new Date(drawTime).getTime() - now

    if (distance < 0) {
      clearInterval(interval)
      if (timerElement) timerElement.innerHTML = '<span class="text-blackbyte-red">RAFFLE ENDED</span>'
      const buyButton = document.getElementById(`buy-raffle-ticket-${raffleId}`)
      if (buyButton) {
        buyButton.disabled = true
        buyButton.textContent = "RAFFLE ENDED"
      }
      loadRaffles()
      return
    }

    const days = Math.floor(distance / (1000 * 60 * 60 * 24))
    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60))
    const seconds = Math.floor((distance % (1000 * 60)) / 1000)

    if (timerElement) timerElement.innerHTML = `${days}d ${hours}h ${minutes}m ${seconds}s`
  }, 1000)
}

async function buyRaffleTicket(raffleId, ticketPrice, ticketsLeft, buttonElement) {
  if (!currentUser) {
    showModal(elements.walletModal)
    return
  }

  if (currentUser.credits < ticketPrice) {
    showNotification(`Not enough $BB! You need ${ticketPrice} $BB.`, "error")
    return
  }

  if (ticketsLeft <= 0) {
    showNotification("This raffle is sold out!", "error")
    return
  }

  const walletInput = document.getElementById(`raffle-wallet-input-${raffleId}`)
  const walletAddress = walletInput ? walletInput.value.trim() : ""

  if (!walletAddress.startsWith("0x") || walletAddress.length < 10) {
    showNotification("An invalid wallet address was detected. Please reconnect your wallet.", "error");
    return;
  }

  const originalButtonText = buttonElement.textContent
  buttonElement.disabled = true
  buttonElement.textContent = "LOADING..."
  buttonElement.classList.add("loading")

  try {
    const data = await apiRequest(`${BACKEND_URL}/raffles/buy-ticket`, {
      method: "POST",
      body: JSON.stringify({
        userId: currentUser._id,
        raffleId,
        ticketPrice,
        walletAddress,
      }),
    })

    showNotification(`You bought 1 ticket for ${data.raffle.name}! Your wallet is registered.`, "success")
    currentUser = data.user
    sessionStorage.setItem("current_user_wallet", JSON.stringify(currentUser))
    updateUserUI()
    loadRaffles()
    buttonElement.textContent = "BOUGHT!"
  } catch (error) {
    console.error("Error buying raffle ticket:", error)
    showNotification("Failed to buy raffle ticket.", "error")
    buttonElement.textContent = originalButtonText
    buttonElement.classList.remove("loading")
    buttonElement.disabled = false
  }
}

// Leaderboard Functions
async function loadLeaderboard() {
  if (!currentUser || !elements.leaderboardList) return

  elements.leaderboardList.innerHTML = '<p class="text-gray-400">Loading leaderboard...</p>'

  try {
    const users = await apiRequest(`${BACKEND_URL}/auth/users-credits`)
    allUsersData = users.sort((a, b) => b.credits - a.credits)

    renderLeaderboardList()
    checkCurrentUserRank()
  } catch (error) {
    console.error("Error loading leaderboard:", error)
    elements.leaderboardList.innerHTML =
      '<p class="text-red-400">Error loading leaderboard. Please try again later.</p>'
  }
}

function renderLeaderboardList() {
  elements.leaderboardList.innerHTML = ""

  if (allUsersData.length === 0) {
    elements.leaderboardList.innerHTML = '<p class="text-gray-400">No users found on the leaderboard.</p>'
    return
  }

  const top10 = allUsersData.slice(0, 10)
  const table = document.createElement("table")
  table.className = "w-full text-left table-auto"
  table.innerHTML = `
        <thead>
            <tr class="bg-blackbyte-dark border-b border-blackbyte-border-gray">
                <th class="p-3 text-blackbyte-red">RANK</th>
                <th class="p-3 text-blackbyte-red">USERNAME</th>
                <th class="p-3 text-blackbyte-red">CREDITS</th>
            </tr>
        </thead>
        <tbody id="leaderboard-table-body">
        </tbody>
    `
  elements.leaderboardList.appendChild(table)

  const tbody = document.getElementById("leaderboard-table-body")
  top10.forEach((user, index) => {
    const row = document.createElement("tr")
    row.className = `border-b border-blackbyte-border-gray ${user.walletAddress.toLowerCase() === currentUser?.walletAddress.toLowerCase() ? "bg-blackbyte-red bg-opacity-20" : ""}`
    row.innerHTML = `
            <td class="p-3">${index + 1}</td>
            <td class="p-3">${user.username || user.walletAddress.substring(0, 6) + '...'}</td>
            <td class="p-3 text-green-400">${user.credits.toLocaleString()}</td>
        `
    tbody.appendChild(row)
  })
}

function checkCurrentUserRank() {
  const searchResult = document.getElementById("leaderboard-search-result")
  if (!searchResult) return

  if (currentUser && allUsersData.length > 0) {
    const currentUserInLeaderboard = allUsersData.find((user) => user.walletAddress.toLowerCase() === currentUser.walletAddress.toLowerCase())
    if (currentUserInLeaderboard) {
      const rank = allUsersData.indexOf(currentUserInLeaderboard) + 1
      searchResult.innerHTML = `
                <p class="text-white text-lg">Your rank: <span class="text-green-400 font-bold">#${rank}</span> with <span class="text-green-400 font-bold">${currentUser.credits.toLocaleString()} $BB</span></p>
            `
    } else {
      searchResult.innerHTML = '<p class="text-gray-400">Your rank could not be determined.</p>'
    }
  } else {
    searchResult.innerHTML = ""
  }
}

// Staking Dashboard
async function renderStakingDashboard() {
  if (!currentUser || !currentUser.walletAddress) return;

  const walletNftsContainer = document.getElementById("wallet-nfts-container");
  const stakedNftsContainer = document.getElementById("staked-nfts-container");
  const accumulatedRewardsDisplay = document.getElementById("accumulated-rewards-display");
  const claimAllRewardsBtn = document.getElementById("claim-all-rewards-btn");

  if (!walletNftsContainer || !stakedNftsContainer || !accumulatedRewardsDisplay || !claimAllRewardsBtn) return;

  walletNftsContainer.innerHTML = '<p class="text-gray-400">Loading your NFTs...</p>';
  stakedNftsContainer.innerHTML = '<p class="text-gray-400">Loading staked NFTs...</p>';
  accumulatedRewardsDisplay.textContent = '0 $BB';
  claimAllRewardsBtn.disabled = true;

  try {
    const nftsInWallet = await getUserNftsInWallet(currentUser.walletAddress);
    const stakedRecords = await apiRequest(`${BACKEND_URL}/staking/user-staked-nfts`);

    const nftsInWalletMap = new Map();
    nftsInWallet.forEach(nft => nftsInWalletMap.set(nft.tokenId, nft));

    let totalAccumulatedRewards = 0;
    const confirmedStakedNfts = [];
    const recordsToDeactivate = [];

    for (const record of stakedRecords) {
      let isOwnerOnChain = false;
      try {
        isOwnerOnChain = nftsInWalletMap.has(record.tokenId);
      } catch (checkError) {
        console.warn(`Could not verify on-chain ownership for staked NFT ${record.tokenId}:`, checkError.message);
        isOwnerOnChain = false;
      }

      if (isOwnerOnChain) {
        confirmedStakedNfts.push(record);
        totalAccumulatedRewards += record.accumulatedRewards;
      } else {
        recordsToDeactivate.push(record._id);
        console.log(`Staked NFT #${record.tokenId} found in backend but not in wallet. Will deactivate.`);
      }
    }

    stakedNftsContainer.innerHTML = '';
    if (confirmedStakedNfts.length === 0) {
      stakedNftsContainer.innerHTML = '<p class="text-gray-400">No NFTs currently staked or found in your wallet.</p>';
    } else {
      confirmedStakedNfts.forEach(record => {
        let stakedImageUrl = "nft-placeholder.png";
        if (nftsInWalletMap.has(record.tokenId)) {
          stakedImageUrl = nftsInWalletMap.get(record.tokenId).imageUrl;
        }
        const card = createStakingNftCard(record.tokenId, true, record.accumulatedRewards, stakedImageUrl);
        stakedNftsContainer.appendChild(card);
      });
    }

    walletNftsContainer.innerHTML = '';
    const unstakedNfts = nftsInWallet.filter(nft => !confirmedStakedNfts.some(s => s.tokenId === nft.tokenId));

    if (unstakedNfts.length === 0 && confirmedStakedNfts.length === 0) {
      walletNftsContainer.innerHTML = '<p class="text-gray-400">No BlackByte NFTs found in your wallet.</p>';
    } else if (unstakedNfts.length === 0 && confirmedStakedNfts.length > 0) {
      walletNftsContainer.innerHTML = '<p class="text-gray-400">All your NFTs are currently staked!</p>';
    } else {
      unstakedNfts.forEach(nft => {
        const card = createStakingNftCard(nft.tokenId, false, 0, nft.imageUrl || "nft-placeholder.png");
        walletNftsContainer.appendChild(card);
      });
    }

    accumulatedRewardsDisplay.textContent = `${totalAccumulatedRewards.toLocaleString()} $BB`;
    if (totalAccumulatedRewards > 0) {
      claimAllRewardsBtn.disabled = false;
      claimAllRewardsBtn.removeEventListener('click', handleClaimRewards);
      claimAllRewardsBtn.addEventListener('click', () => handleClaimRewards());
    } else {
      claimAllRewardsBtn.disabled = true;
    }

    if (recordsToDeactivate.length > 0) {
      console.log("Sending requests to deactivate stale staking records:", recordsToDeactivate);
      for (const recordId of recordsToDeactivate) {
        const record = stakedRecords.find(r => r._id === recordId);
        if (record) {
          try {
            await apiRequest(`${BACKEND_URL}/staking/unstake`, {
              method: 'POST',
              body: JSON.stringify({ tokenId: record.tokenId })
            });
            console.log(`Successfully deactivated stale record for NFT #${record.tokenId}.`);
          } catch (deactivateError) {
            console.error(`Failed to deactivate stale record for NFT #${record.tokenId}:`, deactivateError.message);
          }
        }
      }
    }

  } catch (error) {
    console.error("Error rendering staking dashboard:", error);
    showNotification("Error loading staking dashboard.", "error");
    walletNftsContainer.innerHTML = '<p class="text-red-400">Error loading NFTs.</p>';
    stakedNftsContainer.innerHTML = '<p class="text-red-400">Error loading staked NFTs.</p>';
  }
}

function createStakingNftCard(tokenId, isStaked, accumulatedRewards = 0, imageUrl = "nft-placeholder.png") {
  const card = document.createElement("div");
  card.className = "bb-card p-4 text-center";
  card.innerHTML = `
        <img src="${imageUrl}" alt="BlackByte ${tokenId}" class="w-full h-auto mb-3 rounded-md">
        <h4 class="font-semibold text-white text-lg">BlackByte #${tokenId}</h4>
        ${isStaked ? `<p class="text-sm text-gray-400">Accumulated: <span class="font-bold text-yellow-400">${accumulatedRewards.toLocaleString()} $BB</span></p>` : ''}
        <button class="bb-btn bb-btn-primary w-full mt-3 ${isStaked ? 'unstake-btn' : 'stake-btn'}" data-token-id="${tokenId}">
            ${isStaked ? 'UNSTAKE' : 'STAKE'}
        </button>
    `;

  const actionBtn = card.querySelector('.stake-btn, .unstake-btn');
  if (actionBtn) {
    actionBtn.addEventListener('click', () => {
      if (isStaked) {
        handleUnstakeNft(tokenId, accumulatedRewards);
      } else {
        handleStakeNft(tokenId);
      }
    });
  }
  return card;
}

async function handleStakeNft(tokenId) {
  if (!currentUser) {
    showModal(elements.walletModal);
    return;
  }

  const button = document.querySelector(`.stake-btn[data-token-id="${tokenId}"]`);
  const originalText = button.textContent;
  button.disabled = true;
  button.textContent = 'Staking...';
  button.classList.add('loading');

  try {
    const data = await apiRequest(`${BACKEND_URL}/staking/stake`, {
      method: 'POST',
      body: JSON.stringify({ tokenId })
    });

    showNotification(data.message, 'success');
    renderStakingDashboard();
  } catch (error) {
    console.error('Error staking NFT:', error);
    showNotification(error.message || 'Failed to stake NFT.', 'error');
  } finally {
    button.disabled = false;
    button.textContent = originalText;
    button.classList.remove('loading');
  }
}

async function handleUnstakeNft(tokenId, accumulatedRewards) {
  if (!currentUser) {
    showModal(elements.walletModal);
    return;
  }

  const confirmUnstake = confirm(`Are you sure you want to unstake NFT #${tokenId}? You will claim any accumulated rewards: ${accumulatedRewards.toLocaleString()} $BB.`);
  if (!confirmUnstake) return;

  const button = document.querySelector(`.unstake-btn[data-token-id="${tokenId}"]`);
  const originalText = button.textContent;
  button.disabled = true;
  button.textContent = 'Unstaking...';
  button.classList.add('loading');

  try {
    const data = await apiRequest(`${BACKEND_URL}/staking/unstake`, {
      method: 'POST',
      body: JSON.stringify({ tokenId })
    });

    showNotification(data.message, 'success');
    currentUser = data.user;
    sessionStorage.setItem("current_user_wallet", JSON.stringify(currentUser));
    updateUserUI();
    renderStakingDashboard();
  } catch (error) {
    console.error('Error unstaking NFT:', error);
    showNotification(error.message || 'Failed to unstake NFT.', 'error');
  } finally {
    button.disabled = false;
    button.textContent = originalText;
    button.classList.remove('loading');
  }
}

async function handleClaimRewards(tokenId = null) {
  if (!currentUser) {
    showModal(elements.walletModal);
    return;
  }

  const button = document.getElementById("claim-all-rewards-btn");
  const originalText = button.textContent;
  button.disabled = true;
  button.textContent = 'Claiming...';
  button.classList.add('loading');

  try {
    const body = tokenId ? { tokenId } : {};
    const data = await apiRequest(`${BACKEND_URL}/staking/claim-rewards`, {
      method: 'POST',
      body: JSON.stringify(body)
    });

    showNotification(data.message, 'success');
    currentUser = data.user;
    sessionStorage.setItem("current_user_wallet", JSON.stringify(currentUser));
    updateUserUI();
    renderStakingDashboard();
  } catch (error) {
    console.error('Error claiming rewards:', error);
    showNotification(error.message || 'Failed to claim rewards.', 'error');
  } finally {
    button.disabled = false;
    button.textContent = originalText;
    button.classList.remove('loading');
  }
}


// --- AUCTIONS FUNCTIONS ---

async function loadAuctions() {
    if (!currentUser || !elements.activeAuctionsContainer || !elements.endedAuctionsContainer) return;

    elements.activeAuctionsContainer.innerHTML = '<p class="text-gray-400">Loading active auctions...</p>';
    elements.endedAuctionsContainer.innerHTML = '<p class="text-gray-400">Loading ended auctions...</p>';

    try {
        const [activeResp] = await Promise.all([
            fetch(`${BACKEND_URL}/auctions/active`),
        ]);

        if (!activeResp.ok) {
            throw new Error(`HTTP error! status: ${activeResp.status}`);
        }

        const activeAuctions = await activeResp.json();
        
        renderActiveAuctions(activeAuctions);
        // renderEndedAuctions(); // Implement this if you create a separate endpoint for ended auctions
    } catch (error) {
        console.error("Error loading auctions:", error);
        elements.activeAuctionsContainer.innerHTML = '<p class="text-red-400">Error loading auctions. Please try again later.</p>';
        elements.endedAuctionsContainer.innerHTML = '';
    }
}

function renderActiveAuctions(auctions) {
    elements.activeAuctionsContainer.innerHTML = '';

    if (auctions.length === 0) {
        elements.activeAuctionsContainer.innerHTML = '<p class="text-gray-400 col-span-full">No active auctions at the moment. Check back later!</p>';
        return;
    }

    auctions.forEach(auction => {
        const timeLeft = new Date(auction.endTime).getTime() - Date.now();
        const auctionEnded = timeLeft <= 0;

        const auctionCard = createAuctionCard(auction, auctionEnded);
        elements.activeAuctionsContainer.appendChild(auctionCard);

        if (!auctionEnded) {
            const timerElement = document.getElementById(`auction-timer-${auction._id}`);
            startAuctionCountdown(auction.endTime, timerElement, auction._id);
        }
    });
}

// Update createAuctionCard to use auction.name and auction.imageUrl
function createAuctionCard(auction, auctionEnded) {
    const timeDisplay = auctionEnded ? '<span class="text-blackbyte-red">AUCTION ENDED</span>' : '';
    const highestBidderDisplay = auction.highestBidder
        ? `Highest Bidder: <span class="font-bold text-yellow-400">${auction.highestBidder.substring(0, 6)}...${auction.highestBidder.substring(auction.highestBidder.length - 4)}</span>`
        : 'No bids yet.';

    const card = document.createElement("div");
    card.className = "bb-card p-6 flex flex-col";
    card.innerHTML = `
        <div class="raffle-image-wrapper">
            <img src="${auction.imageUrl || 'nft-placeholder.png'}" alt="${auction.name || 'NFT'}" class="w-full h-full object-cover">
        </div>
        <h3 class="text-xl font-orbitron text-white mb-2">${auction.name || `NFT #${auction.tokenId}`}</h3>
        <p class="text-sm text-gray-400 mb-3">Starting bid: <span class="font-bold text-green-400">${auction.minBid.toLocaleString()} $BB</span></p>
        
        <div class="flex justify-between items-center text-sm mb-2">
            <span>Current Bid:</span>
            <span class="font-bold text-blackbyte-red">${auction.currentBid.toLocaleString()} $BB</span>
        </div>
        <div class="text-xs text-gray-500 mb-3">
            ${highestBidderDisplay}
        </div>
        
        <div class="text-xs text-gray-500 mt-2 text-center mb-4">
            Ends in: <span class="font-orbitron text-blackbyte-red" id="auction-timer-${auction._id}">${timeDisplay}</span>
        </div>
        
        <input type="number" id="auction-bid-input-${auction._id}" placeholder="Your bid ($BB)" class="bb-input mt-3 mb-2" min="${auction.currentBid + 1}" value="${auction.currentBid + 1}">
        <button id="place-bid-btn-${auction._id}" class="bb-btn bb-btn-primary w-full py-2 mt-auto" ${auctionEnded ? "disabled" : ""}>
            PLACE BID
        </button>
    `;

    const bidInput = card.querySelector(`#auction-bid-input-${auction._id}`);
    if (bidInput) {
        bidInput.value = auction.currentBid + 1;
    }

    const placeBidButton = card.querySelector(`#place-bid-btn-${auction._id}`);
    if (placeBidButton) {
        placeBidButton.addEventListener('click', () => handlePlaceBid(auction._id, bidInput.value, placeBidButton));
    }

    return card;
}

function startAuctionCountdown(endTime, timerElement, auctionId) {
    const interval = setInterval(() => {
        const now = new Date().getTime();
        const distance = new Date(endTime).getTime() - now;

        if (distance < 0) {
            clearInterval(interval);
            if (timerElement) timerElement.innerHTML = '<span class="text-blackbyte-red">AUCTION ENDED</span>';
            const bidButton = document.getElementById(`place-bid-btn-${auctionId}`);
            if (bidButton) {
                bidButton.disabled = true;
                bidButton.textContent = "AUCTION ENDED";
            }
            loadAuctions();
            return;
        }

        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);

        if (timerElement) timerElement.innerHTML = `${days}d ${hours}h ${minutes}m ${seconds}s`;
    }, 1000);
}

async function handlePlaceBid(auctionId, bidAmount, buttonElement) {
    if (!currentUser) {
        showModal(elements.walletModal);
        return;
    }

    const parsedBidAmount = Number(bidAmount);

    if (isNaN(parsedBidAmount) || parsedBidAmount <= 0) {
        showNotification("Please enter a valid bid amount.", "error");
        return;
    }

    const originalButtonText = buttonElement.textContent;
    buttonElement.disabled = true;
    buttonElement.textContent = "PLACING BID...";
    buttonElement.classList.add("loading");

    try {
        const data = await apiRequest(`${BACKEND_URL}/auctions/${auctionId}/bid`, {
            method: "POST",
            body: JSON.stringify({ bidAmount: parsedBidAmount }),
        });

        showNotification(data.message, "success");
        currentUser = data.user;
        sessionStorage.setItem("current_user_wallet", JSON.stringify(currentUser));
        updateUserUI();
        loadAuctions();
    } catch (error) {
        console.error("Error placing bid:", error);
        showNotification(error.message || "Failed to place bid.", "error");
    } finally {
        buttonElement.textContent = originalButtonText;
        buttonElement.disabled = false;
        buttonElement.classList.remove("loading");
    }
}


// Event Listeners Setup
function setupEventListeners() {
  document.querySelectorAll(".close-modal").forEach((closeBtn) => {
    closeBtn.addEventListener("click", (e) => {
      const modal = e.target.closest("#my-account-modal, #purchase-modal, #admin-panel, #update-info-modal, #wallet-modal, #wrong-chain-modal");

      if (modal) {
        hideModal(modal);
      } else {
        console.warn("Close button clicked but no relevant modal parent found:", e.target);
      }
    });
  });

  if (elements.connectWalletButton) {
    elements.connectWalletButton.addEventListener("click", () => {
      showModal(elements.walletModal);
    });
  }

  const connectMetamaskBtn = document.getElementById('connect-metamask');
  const connectRabbyBtn = document.getElementById('connect-rabby');
  if (connectMetamaskBtn) {
    connectMetamaskBtn.addEventListener('click', () => handleWalletOptionClick('injected'));
  }
  if (connectRabbyBtn) {
    connectRabbyBtn.addEventListener('click', () => handleWalletOptionClick('injected'));
  }

  if (elements.spinBtn) {
    elements.spinBtn.addEventListener("click", handleSpin)
  }

  if (elements.dailyBonusBtn) {
    elements.dailyBonusBtn.addEventListener("click", handleDailyBonus)
  }

  if (elements.jackpotBuyBtn) {
    elements.jackpotBuyBtn.addEventListener("click", handleJackpotBuy)
  }

  if (elements.utilitiesBtn) {
    elements.utilitiesBtn.addEventListener("click", () => {
      if (!currentUser || !currentUser.walletAddress) {
        showLoginFirstMessage()
        return
      }
      elements.utilitiesSidebar.classList.toggle("open")
    })
  }

  const utilitiesOverlay = document.querySelector(".utilities-overlay")
  if (utilitiesOverlay) {
    utilitiesOverlay.addEventListener("click", () => {
      elements.utilitiesSidebar.classList.remove("open")
    })
  }

  setupUtilitiesNavigation()

  if (elements.userAvatar) {
    elements.userAvatar.addEventListener("click", () => {
      if (currentUser && currentUser.walletAddress) {
        showMyAccountModal()
      }
    })
  }

  document.querySelectorAll(".play-existing-game").forEach((button) => {
    button.addEventListener("click", (event) => {
      if (!currentUser || !currentUser.walletAddress) {
        showLoginFirstMessage()
        return
      }
      const targetTabId = event.currentTarget.dataset.targetTab
      if (targetTabId) {
        activateTab(targetTabId)
      }
    })
  })

  document.querySelectorAll('[id$="-prompt-auth-button"]').forEach((button) => {
    button.addEventListener("click", () => showLoginFirstMessage())
  })

  setupShopButtons()

  setupTweetMissionListeners()

  window.addEventListener("click", (e) => {
    if (e.target === elements.myAccountModal) hideModal(elements.myAccountModal)
    if (e.target === elements.updateInfoModal) hideModal(elements.updateInfoModal)
    if (e.target === elements.wrongChainModal) hideModal(elements.wrongChainModal);
  })

  const wrongChainModalButton = document.getElementById("wrong-chain-modal-button");
  if (wrongChainModalButton) {
    wrongChainModalButton.addEventListener("click", async () => {
      try {
        await web3Provider.send("wallet_switchEthereumChain", [{
          chainId: `0x${REQUIRED_CHAIN_ID.toString(16)}`
        }]);
      } catch (switchError) {
        if (switchError.code === 4902) {
          try {
            await web3Provider.send("wallet_addEthereumChain", [{
              chainId: `0x${REQUIRED_CHAIN_ID.toString(16)}`,
              chainName: "ApeChain",
              nativeCurrency: {
                name: "ApeCoin",
                symbol: "ETH",
                decimals: 18
              },
              rpcUrls: ["https://rpc.apechain.com"],
              blockExplorerUrls: ["https://apechain.apecoin.com/"]
            }]);
          } catch (addError) {
            console.error("Failed to add ApeChain:", addError);
            showNotification("Could not add ApeChain to your wallet. Please add it manually.", "error");
          }
        } else {
          console.error("Failed to switch chain:", switchError);
          showNotification("Failed to switch chain in your wallet. Please switch manually.", "error");
        }
      }
    });
  }
}

function setupUtilitiesNavigation() {
  const utilityItems = document.querySelectorAll(".utilities-nav li > span")

  utilityItems.forEach((span) => {
    span.addEventListener("click", (e) => {
      const li = e.currentTarget.parentElement

      if (li.querySelector("ul")) {
        li.classList.toggle("expanded")
      } else {
        const targetTab = li.getAttribute("data-target-tab")
        const targetModal = li.getAttribute("data-target-modal")

        if (targetTab) {
          activateTab(targetTab)
          elements.utilitiesSidebar.classList.remove("open")
        } else if (targetModal) {
          if (targetModal === "my-account") {
            showMyAccountModal()
          } else if (targetModal === "admin") {
            if (currentUser && currentUser.isAdmin) {
              showModal(elements.adminPanel);
              document.getElementById("admin-content").classList.remove("hidden");
              loadWLPurchases();
              loadRaffleSelectOptions();
            } else {
              showNotification("Admin access denied.", "error");
            }
          }
          elements.utilitiesSidebar.classList.remove("open")
        }
      }
    })
  })
  document.querySelectorAll(".utilities-nav li ul li[data-target-tab]").forEach((item) => {
    item.addEventListener("click", (e) => {
      const targetTab = e.currentTarget.getAttribute("data-target-tab")
      if (targetTab) {
        activateTab(targetTab)
        elements.utilitiesSidebar.classList.remove("open")
      }
    })
  })
}

function setupShopButtons() {
  const shopButtons = [{
    id: "gtd-wl-btn",
    cost: 10000,
    type: "GTD"
  }, {
    id: "fcfs-wl-btn",
    cost: 5000,
    type: "FCFS"
  }, {
    id: "blackbyte-free-btn",
    cost: 100000,
    type: "BLACKBYTEFREE"
  }, ]

  shopButtons.forEach(({
    id,
    cost,
    type
  }) => {
    const btn = document.getElementById(id)
    if (btn) {
      btn.addEventListener("click", () => {
        if (!currentUser) {
          showModal(elements.walletModal)
          return
        }

        if (currentUser.purchases?.map((p) => p.toUpperCase()).includes(type.toUpperCase())) {
          showNotification(`You already purchased a ${type} WL spot!`, "error")
          return
        }

        if (currentUser.credits < cost) {
          showNotification(`Not enough $BB! You need ${cost} $BB.`, "error")
          return
        }

        showPurchaseModal(type)
      })
    }
  })
}

function setupTweetMissionListeners() {
  if (tweetMissionListenersAttached || !elements.tweetMissionsContainer) return

  elements.tweetMissionsContainer.addEventListener("click", async (event) => {
    const goToTweetButton = event.target.closest(".go-to-tweet-btn")
    const claimPointsButton = event.target.closest(".claim-points-btn")

    if (goToTweetButton && !goToTweetButton.disabled) {
      window.open(goToTweetButton.dataset.url, "_blank")

      const card = goToTweetButton.closest(".bb-card")
      const claimButtonElement = card.querySelector(".claim-points-btn")

      if (
        claimButtonElement &&
        !claimButtonElement.classList.contains("claim-claimed") &&
        claimButtonElement.dataset.timerActive !== "true"
      ) {
        startClaimTimer(claimButtonElement)
      }
    } else if (claimPointsButton) {
      await handleClaimPoints(claimPointsButton)
    }
  })

  tweetMissionListenersAttached = true
}

function startClaimTimer(claimButtonElement) {
  claimButtonElement.disabled = true
  claimButtonElement.dataset.timerActive = "true"
  let countdown = 10

  claimButtonElement.textContent = `WAIT ${countdown}s`
  claimButtonElement.classList.remove("bb-btn-secondary", "opacity-50")
  claimButtonElement.classList.add("bb-btn", "bg-gray-600", "text-white")

  if (claimButtonElement.intervalId) clearInterval(claimButtonElement.intervalId)

  claimButtonElement.intervalId = setInterval(() => {
    countdown--
    if (countdown > 0) {
      claimButtonElement.textContent = `WAIT ${countdown}s`
    } else {
      clearInterval(claimButtonElement.intervalId)
      claimButtonElement.classList.remove("bg-gray-600")
      claimButtonElement.classList.add("bb-btn-primary")
      claimButtonElement.textContent = "CLAIM POINTS"
      claimButtonElement.disabled = false
      delete claimButtonElement.dataset.timerActive
    }
  }, 1000)
}

async function handleClaimPoints(claimPointsButton) {
  if (!currentUser) {
    showModal(elements.walletModal)
    return
  }

  if (claimPointsButton.classList.contains("claim-claimed") || claimPointsButton.textContent === "MISSION ENDED") {
    showNotification(claimPointsButton.textContent, "error")
    return
  }

  if (claimPointsButton.disabled || !claimPointsButton.classList.contains("bb-btn-primary")) {
    showNotification("Click 'GO TO TWEET', interact, and wait for timer.", "error")
    return
  }

  const missionId = claimPointsButton.dataset.missionId
  const rewardPoints = Number.parseInt(claimPointsButton.dataset.reward)

  try {
    const data = await apiRequest(`${BACKEND_URL}/twitter/claim-mission`, {
      method: "POST",
      body: JSON.stringify({
        userId: currentUser._id,
        missionId,
        rewardPoints,
      }),
    })

    if (data.message === "$BB claimed successfully!") {
      showNotification(`Mission complete! +${rewardPoints} $BB.`, "success")
    } else {
      showNotification(data.message || "Failed to claim points.", "error")
    }

    if (data.user) {
      currentUser = data.user
      sessionStorage.setItem("current_user_wallet", JSON.stringify(currentUser))
      updateUserUI()
    }

    claimPointsButton.classList.remove("bb-btn-primary")
    claimPointsButton.classList.add("bb-btn-secondary", "opacity-50")
    claimPointsButton.textContent = "CLAIMED"
    claimPointsButton.disabled = true
  } catch (error) {
    console.error("Error claiming points:", error)
    showNotification("Failed to claim points.", "error")
  }
}

function initWeb3Modal() {
  const providerOptions = {
    injected: {
      display: {
        name: "Injected",
        description: "Connect with browser wallet (MetaMask, Rabby, etc.)",
      },
      package: null
    },
  };

  web3Modal = new Web3Modal.default({
    cacheProvider: true,
    theme: "dark",
    providerOptions,
    disableInjectedProvider: false
  });
  console.log("Web3Modal initialized.");
}

async function connectWallet() {
  showNotification("Connecting to wallet...", "info");
  try {
    const instance = await web3Modal.connect();
    web3Provider = new ethers.providers.Web3Provider(instance);
    signer = web3Provider.getSigner();
    currentConnectedWalletAddress = await signer.getAddress();

    const network = await web3Provider.getNetwork();
    const chainId = network.chainId;

    console.log(`Connected to wallet: ${currentConnectedWalletAddress} on Chain ID: ${chainId}`);

    await authenticateWithBackend(currentConnectedWalletAddress);

    if (instance.on) {
      instance.on('accountsChanged', (newAccounts) => {
        if (newAccounts.length > 0) {
          console.log("Account changed:", newAccounts[0]);
          authenticateWithBackend(newAccounts[0]);
        } else {
          handleLogout();
        }
      });

      instance.on('chainChanged', (newChainId) => {
        console.log("Chain changed to:", parseInt(newChainId, 16));
        authenticateWithBackend(currentConnectedWalletAddress);
      });

      instance.on('disconnect', (code, reason) => {
        console.log("Wallet disconnected:", code, reason);
        handleLogout();
      });
    } else {
      console.warn("Provider does not have an 'on' method for event listeners.");
    }

  } catch (error) {
    console.error("Error connecting to wallet:", error);
    showNotification("Failed to connect wallet. " + (error.message || "Please ensure MetaMask/Rabby is installed and unlocked."), "error");
    throw error;
  }
}

async function handleWalletOptionClick(providerType) {
  hideModal(elements.walletModal);
  showNotification("Connecting to wallet...", "info");
  try {
    if (web3Modal.cachedProvider) {
      await web3Modal.clearCachedProvider();
      console.log("Web3Modal cached provider cleared explicitly.");
    }

    const instance = await web3Modal.connectTo(providerType);

    web3Provider = new ethers.providers.Web3Provider(instance);

    signer = web3Provider.getSigner();
    currentConnectedWalletAddress = await signer.getAddress();

    const network = await web3Provider.getNetwork();
    const chainId = network.chainId;

    console.log(`Connected to wallet: ${currentConnectedWalletAddress} on Chain ID: ${chainId}`);

    await authenticateWithBackend(currentConnectedWalletAddress);

    if (instance.on) {
      instance.on('accountsChanged', (newAccounts) => {
        if (newAccounts.length > 0) {
          console.log("Account changed:", newAccounts[0]);
          authenticateWithBackend(newAccounts[0]);
        } else {
          handleLogout();
        }
      });

      instance.on('chainChanged', (newChainId) => {
        console.log("Chain changed to:", parseInt(newChainId, 16));
        authenticateWithBackend(currentConnectedWalletAddress);
      });

      instance.on('disconnect', (code, reason) => {
        console.log("Wallet disconnected:", code, reason);
        handleLogout();
      });
    } else {
      console.warn("Provider does not have an 'on' method for event listeners.");
    }

  } catch (error) {
    console.error("Error connecting to wallet:", error);
    showNotification("Failed to connect wallet. " + (error.message || "Please ensure MetaMask/Rabby is installed and unlocked."), "error");
    handleLogout();
  }
}

async function authenticateWithBackend(walletAddress) {
  hideWrongChainModal();
  try {
    const data = await apiRequest(`${BACKEND_URL}/auth/wallet-login`, {
      method: "POST",
      body: JSON.stringify({ walletAddress }),
    });

    if (data.message === "User found and logged in" || data.message === "User created and logged in") {
      currentUser = data.user;
      sessionStorage.setItem("current_user_wallet", JSON.stringify(currentUser));
      updateUserUI();

      userHasNft = await checkNftOwnership();

      const activeTabElement = document.querySelector('.tab-content.active');
      const currentActiveTabId = activeTabElement ? activeTabElement.id : 'home';

      activateTab(currentActiveTabId);

      if (userHasNft) {
        showNotification("NFT found! Access granted to Holder Tools.", "success");
      } else {
        showNotification("No BlackByte NFT found in your connected wallet. Access denied to Holder Tools.", "error");
      }

    } else {
      showNotification(data.message || "Failed to authenticate with backend.", "error");
      handleLogout();
    }
  } catch (error) {
    console.error("Error authenticating with backend:", error);
    showNotification("Error authenticating with backend. Please try again.", "error");
    handleLogout();
  }
}

async function handleLogout() {
  currentUser = null;
  sessionStorage.removeItem("current_user_wallet");
  currentConnectedWalletAddress = null;
  web3Provider = null;
  signer = null;
  userHasNft = false;

  if (web3Modal) {
    await web3Modal.clearCachedProvider();
    console.log("Web3Modal cached provider cleared on logout.");
  }

  updateUserUI();
  showNotification("Wallet disconnected successfully.", "success");
  activateTab("home");

  if (elements.myAccountModal) {
    hideModal(elements.myAccountModal);
  }
  hideWrongChainModal();
}


// Game Functions
async function handleSpin() {
  if (!currentUser) {
    showModal(elements.walletModal)
    return
  }

  if (currentUser.credits < 50) {
    showNotification("Not enough $BB! You need 50 $BB.", "error")
    return
  }

  elements.spinBtn.disabled = true
  elements.spinBtn.textContent = "SPINNING..."
  elements.spinBtn.classList.add("loading")

  const reels = startSlotSpin()

  try {
    const data = await apiRequest(`${BACKEND_URL}/game/spin`, {
      method: "POST",
      body: JSON.stringify({ userId: currentUser._id }),
    })

    await stopSlotSpin(reels, data.results)

    currentUser = data.user
    sessionStorage.setItem("current_user_wallet", JSON.stringify(currentUser))
    updateUserUI()

    const notificationType = data.winAmount > 0 ? "success" : "info"
    showNotification(data.message, notificationType)

    loadRecentJackpotWins()
  } catch (error) {
    console.error("Error during spin:", error)
    showNotification("Network error during spin.", "error")

    reels.forEach((reel) => { if (reel) reel.classList.remove("spinning") })
  } finally {
    elements.spinBtn.textContent = "SPIN (50 $BB)"
    elements.spinBtn.disabled = false
    elements.spinBtn.classList.remove("loading")
  }
}

async function handleDailyBonus() {
  if (!currentUser) {
    showModal(elements.walletModal)
    return
  }

  try {
    const data = await apiRequest(`${BACKEND_URL}/bonus`, {
      method: "POST",
      body: JSON.stringify({ userId: currentUser._id }),
    })

    if (data.message === "Daily bonus claimed successfully!") {
      showNotification("Daily bonus claimed! +25 $BB", "success")
      currentUser = data.user
      sessionStorage.setItem("current_user_wallet", JSON.stringify(currentUser))
      updateUserUI()

      elements.dailyBonusBtn.disabled = true
      elements.dailyBonusBtn.textContent = "ALREADY CLAIMED"
      elements.dailyBonusBtn.classList.remove("bb-btn-primary")
      elements.dailyBonusBtn.classList.add("bb-btn-secondary", "opacity-50")

      const lastBonusTime = new Date(data.user.lastBonus || Date.now()).getTime()
      const msAlreadyPassed = Date.now() - lastBonusTime
      const countdownStartSeconds = Math.max(0, 24 * 60 * 60 - Math.floor(msAlreadyPassed / 1000))
      startBonusCountdown(countdownStartSeconds)
    } else {
      showNotification(data.message, "error")
    }
  } catch (error) {
    console.error("Error claiming daily bonus", error)
    showNotification("Error claiming bonus. Please try again.", "error")
  }
}

async function handleJackpotBuy() {
  if (!currentUser) {
    showModal(elements.walletModal)
    return
  }

  if (currentUser.credits < 200) {
    showNotification("Not enough $BB! You need 200 $BB.", "error")
    return
  }

  try {
    const data = await apiRequest(`${BACKEND_URL}/jackpot/buy`, {
      method: "POST",
      body: JSON.stringify({ userId: currentUser._id }),
    })

    showNotification(data.message, "success")
    currentUser = data.user
    sessionStorage.setItem("current_user_wallet", JSON.stringify(currentUser))
    updateUserUI()
    updateJackpotPot()
    updateUserJackpotEntries()
  } catch (error) {
    console.error("Error buying jackpot ticket:", error)
    showNotification("Error buying jackpot ticket.", "error")
  }
}

// Shop Functions
function showPurchaseModal(type) {
  showModal(elements.purchaseModal)
  elements.purchaseModal.dataset.purchaseType = type
}

// My Account Modal
function showMyAccountModal() {
  if (!currentUser || !currentUser.walletAddress) return;

  const accountUsername = document.getElementById("account-username")
  const accountCredits = document.getElementById("account-credits")
  const accountWalletAddress = document.getElementById("account-wallet-address");

  if (accountUsername) accountUsername.textContent = currentUser.username;
  if (accountCredits) accountCredits.textContent = `${currentUser.credits.toLocaleString()} $BB`
  if (accountWalletAddress) accountWalletAddress.textContent = currentUser.walletAddress;
  if (elements.editUsernameInput) elements.editUsernameInput.value = currentUser.username;

  showModal(elements.myAccountModal)
}

async function handleSaveUsername() {
  const newUsername = elements.editUsernameInput.value.trim();

  if (!newUsername) {
    showNotification("Username cannot be empty.", "error");
    return;
  }

  if (newUsername.length < 3 || newUsername.length > 20) {
    showNotification("Username must be between 3 and 20 characters.", "error");
    return;
  }
  if (!/^[a-z0-9_]+$/.test(newUsername.toLowerCase())) {
    showNotification("Username can only contain lowercase letters, numbers, and underscores.", "error");
    return;
  }

  if (newUsername.toLowerCase() === currentUser.username.toLowerCase()) {
    showNotification("Username is already set to this value.", "info");
    elements.cancelUsernameBtn.click();
    return;
  }

  try {
    const data = await apiRequest(`${BACKEND_URL}/auth/update-username`, {
      method: "POST",
      body: JSON.stringify({ newUsername }),
    });

    showNotification(data.message, "success");
    currentUser = data.user;
    sessionStorage.setItem("current_user_wallet", JSON.stringify(currentUser));
    updateUserUI();

    elements.accountUsername.textContent = currentUser.username;
    elements.cancelUsernameBtn.click();
  } catch (error) {
    console.error("Error saving username:", error);
    showNotification(error.message || "Failed to update username.", "error");
  }
}

// Utility Functions
function showError(elementId, message) {
  const errorElement = document.getElementById(elementId)
  if (errorElement) {
    errorElement.textContent = message
    errorElement.style.display = "block"
  }
}

function hideError(elementId) {
  const errorElement = document.getElementById(elementId)
  if (errorElement) {
    errorElement.style.display = "none"
  }
}

// Initialize Application
document.addEventListener("DOMContentLoaded", async () => {
  initializeElements()

  const footerYear = document.getElementById("footer-year")
  if (footerYear) footerYear.textContent = new Date().getFullYear()

  setupEventListeners()

  initWeb3Modal();

  if (web3Modal.cachedProvider) {
    console.log("Found cached Web3 provider. Attempting automatic wallet connection...");
    try {
      await connectWallet();
      console.log("Automatic wallet connection successful.");
      if (currentUser && currentUser.walletAddress) {
        console.log("Found cached user. Re-authenticating with backend and checking NFT ownership...");
        await authenticateWithBackend(currentUser.walletAddress);
      } else {
        updateUserUI();
      }
    } catch (error) {
      console.error("Error during automatic wallet connection:", error);
      showNotification("Failed to automatically connect wallet. Please connect manually.", "error");
      web3Modal.clearCachedProvider();
      handleLogout();
    }
  } else if (currentUser && currentUser.walletAddress) {
    console.warn("Cached user found but no cached Web3 provider. Logging out to force manual connection.");
    handleLogout();
  } else {
    updateUserUI();
  }

  updateJackpotPot();
  updateUserJackpotEntries();

  loadRecentJackpotWins();

  setupAdditionalEventListeners();

  console.log("BlackByte Casino initialized successfully");
});

function setupAdditionalEventListeners() {
  const logoutBtn = document.getElementById("logout-btn-modal")
  if (logoutBtn) {
    logoutBtn.addEventListener("click", handleLogout)
  }

  const confirmUpdateBtn = document.getElementById("confirm-update-info-modal-btn")
  const closeUpdateBtn = document.getElementById("close-update-info-modal-btn")

  if (confirmUpdateBtn) {
    confirmUpdateBtn.addEventListener("click", () => {
      hideModal(elements.updateInfoModal)
    })
  }

  if (closeUpdateBtn) {
    closeUpdateBtn.addEventListener("click", () => {
      hideModal(elements.updateInfoModal)
    })
  }

  const submitWalletBtn = document.getElementById("submit-wallet")
  const closePurchaseBtn = document.getElementById("close-purchase-modal-icon")

  if (submitWalletBtn) {
    submitWalletBtn.addEventListener("click", handleWalletSubmission)
  }

  if (closePurchaseBtn) {
    closePurchaseBtn.addEventListener("click", () => {
      hideModal(elements.purchaseModal)
    })
  }

  setupAdminPanelEvents()

  const leaderboardSearchBtn = document.getElementById("leaderboard-search-btn")
  const leaderboardSearchInput = document.getElementById("leaderboard-search-input")

  if (leaderboardSearchBtn) {
    leaderboardSearchBtn.addEventListener("click", handleLeaderboardSearch)
  }

  if (leaderboardSearchInput) {
    leaderboardSearchInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        handleLeaderboardSearch()
      }
    })
  }

  if (elements.editUsernameBtn) {
    elements.editUsernameBtn.addEventListener("click", () => {
      elements.accountUsername.style.display = "none";
      elements.editUsernameBtn.style.display = "none";
      elements.usernameEditContainer.style.display = "flex";
    });
  }
  if (elements.cancelUsernameBtn) {
    elements.cancelUsernameBtn.addEventListener("click", () => {
      elements.accountUsername.style.display = "block";
      elements.editUsernameBtn.style.display = "block";
      elements.usernameEditContainer.style.display = "none";
      elements.editUsernameInput.value = currentUser.username;
    });
  }
  if (elements.saveUsernameBtn) {
    elements.saveUsernameBtn.addEventListener("click", handleSaveUsername);
  }
}

function setupAdminPanelEvents() {
  const utilAdminItem = document.getElementById("util-admin-item");
  if (utilAdminItem) {
    utilAdminItem.addEventListener("click", () => {
      if (currentUser && currentUser.isAdmin) {
        showModal(elements.adminPanel);
        document.getElementById("admin-content").classList.remove("hidden");
        loadWLPurchases();
        loadRaffleSelectOptions();
      } else {
        showNotification("Admin access denied.", "error");
      }
    });
  }

  const closeAdminBtn = document.getElementById("close-admin");
  if (closeAdminBtn) {
    closeAdminBtn.addEventListener("click", () => {
      hideModal(elements.adminPanel);
      document.getElementById("admin-content").classList.add("hidden");
    });
  }

  const postTweetBtn = document.getElementById("post-tweet-mission-btn");
  const createRaffleBtn = document.getElementById("create-raffle-btn");
  const createAuctionBtn = document.getElementById("create-auction-btn");

  if (postTweetBtn) {
    postTweetBtn.addEventListener("click", handlePostTweetMission);
  }

  if (createRaffleBtn) {
    createRaffleBtn.addEventListener("click", handleCreateRaffle);
  }

  if (createAuctionBtn) {
    createAuctionBtn.addEventListener("click", handleCreateAuction);
  }
}

async function handleWalletSubmission() {
  const walletAddress = document.getElementById("wallet-address").value.trim()
  const purchaseType = elements.purchaseModal.dataset.purchaseType

  if (!walletAddress || !walletAddress.startsWith("0x") || walletAddress.length < 10) {
    showNotification("Please enter a valid wallet address (e.g., 0x...)", "error")
    return
  }

  const costs = {
    GTD: 10000,
    FCFS: 5000,
    BLACKBYTEFREE: 100000
  }
  const cost = costs[purchaseType]

  try {
    const data = await apiRequest(`${BACKEND_URL}/purchase`, {
      method: "POST",
      body: JSON.stringify({
        userId: currentUser._id,
        type: purchaseType,
        cost,
        walletAddress,
      }),
    })

    showNotification(`${purchaseType} WL purchased successfully!`, "success")
    currentUser = data.user
    sessionStorage.setItem("current_user_wallet", JSON.stringify(currentUser))
    updateUserUI()
    hideModal(elements.purchaseModal)
  } catch (error) {
    console.error("Error processing purchase.", error)
    showNotification("Error processing purchase.", "error")
  }
}

async function handleLeaderboardSearch() {
  const searchInput = document.getElementById("leaderboard-search-input")
  const searchResult = document.getElementById("leaderboard-search-result")

  if (!searchInput || !searchResult) return

  const searchTerm = searchInput.value.trim().toLowerCase()
  if (!searchTerm) {
    checkCurrentUserRank()
    return
  }

  if (allUsersData.length === 0) {
    searchResult.innerHTML = '<p class="text-gray-400">Loading leaderboard data...</p>'
    await loadLeaderboard()
  }

  const foundUser = allUsersData.find((user) => user.username.toLowerCase() === searchTerm)
  if (foundUser) {
    const rank = allUsersData.indexOf(foundUser) + 1
    searchResult.innerHTML = `
            <p class="text-white text-lg">
                <span class="text-blue-400 font-bold">${foundUser.username}</span> is ranked
                <span class="text-green-400 font-bold">#${rank}</span> with
                <span class="text-green-400 font-bold">${foundUser.credits.toLocaleString()} $BB</span>
            </p>
        `
  } else {
    searchResult.innerHTML = `<p class="text-red-400">User "${searchTerm}" not found on the leaderboard.</p>`
  }
}

async function loadWLPurchases() {
  const container = document.getElementById("wl-purchases")
  if (!container) return

  try {
    const purchases = await apiRequest(`${BACKEND_URL}/auth/admin/purchases`)
    container.innerHTML = ""

    if (purchases.length === 0) {
      container.innerHTML = '<p class="text-gray-400 col-span-full">No WL purchases yet.</p>'
      return
    }

    purchases.forEach((purchase) => {
      const card = document.createElement("div")
      card.className = "bb-card p-4"
      card.innerHTML = `
                <h4 class="text-lg font-orbitron text-white mb-2">${purchase.type} WL</h4>
                <p class="text-sm text-gray-400 mb-1">User: <span class="text-white">${purchase.username}</span></p>
                <p class="text-sm text-gray-400 mb-1">Wallet: <span class="text-green-400 break-all">${purchase.walletAddress}</span></p>
                <p class="text-xs text-gray-500">Date: ${new Date(purchase.timestamp).toLocaleDateString()}</p>
            `
      container.appendChild(card)
    })
  } catch (error) {
    console.error("Error loading WL purchases:", error)
    container.innerHTML = '<p class="text-red-400">Error loading purchases.</p>'
  }
}

async function handlePostTweetMission() {
  const tweetUrl = document.getElementById("admin-tweet-url").value.trim()
  const missionText = document.getElementById("admin-mission-text").value.trim()
  const rewardPoints = Number.parseInt(document.getElementById("admin-reward-points").value) || 500
  const totalStock = Number.parseInt(document.getElementById("admin-total-stock").value) || null
  const isVideoLink = document.getElementById("admin-is-video-link").checked

  if (!tweetUrl || !missionText) {
    showNotification("Please fill in all required fields.", "error")
    return
  }

  try {
    await apiRequest(`${BACKEND_URL}/twitter/post-mission`, {
      method: "POST",
      body: JSON.stringify({
        tweetUrl,
        missionText,
        rewardPoints,
        totalStock: totalStock || null,
        isVideoLink,
      }),
    })

    showNotification("Tweet mission posted successfully!", "success")

    document.getElementById("admin-tweet-url").value = ""
    document.getElementById("admin-mission-text").value = ""
    document.getElementById("admin-reward-points").value = "500"
    document.getElementById("admin-total-stock").value = "0"
    document.getElementById("admin-is-video-link").checked = false
  } catch (error) {
    console.error("Error posting tweet mission:", error)
    showNotification("Error posting tweet mission.", "error")
  }
}

async function handleCreateRaffle() {
  const name = document.getElementById("raffle-name").value.trim()
  const description = document.getElementById("raffle-description").value.trim()
  const totalTickets = Number.parseInt(document.getElementById("raffle-tickets-available").value)
  const ticketPrice = Number.parseInt(document.getElementById("raffle-ticket-price").value)
  const drawTime = document.getElementById("raffle-draw-time").value
  const imageUrl = document.getElementById("raffle-image-url").value.trim()
  const numberOfWinners = Number.parseInt(document.getElementById("raffle-number-of-winners")?.value) || 1

  if (!name || !description || !totalTickets || !ticketPrice || !drawTime || !imageUrl) {
    showNotification("Please fill in all required fields.", "error")
    return
  }

  try {
    await apiRequest(`${BACKEND_URL}/raffles/create`, {
      method: "POST",
      body: JSON.stringify({
        name,
        description,
        totalTickets,
        ticketPrice,
        drawTime,
        imageUrl,
        numberOfWinners,
      }),
    })

    showNotification("Raffle created successfully!", "success")

    document.getElementById("raffle-name").value = ""
    document.getElementById("raffle-description").value = ""
    document.getElementById("raffle-tickets-available").value = ""
    document.getElementById("raffle-ticket-price").value = ""
    document.getElementById("raffle-draw-time").value = ""
    document.getElementById("raffle-image-url").value = ""

    loadRaffleSelectOptions()
  } catch (error) {
    console.error("Error creating raffle:", error)
    showNotification("Error creating raffle.", "error")
  }
}

async function loadRaffleSelectOptions() {
  const select = document.getElementById("raffle-select-winners")
  if (!select) return

  try {
    const raffles = await apiRequest(`${BACKEND_URL}/raffles/all`)
    select.innerHTML = '<option value="">-- Select a Raffle --</option>'

    raffles.forEach((raffle) => {
      const option = document.createElement("option")
      option.value = raffle._id
      option.textContent = `${raffle.name} (${raffle.status})`
      select.appendChild(option)
    })

    select.addEventListener("change", handleRaffleWinnerView)
  } catch (error) {
    console.error("Error loading raffle options:", error)
  }
}

async function handleRaffleWinnerView() {
  const select = document.getElementById("raffle-select-winners")
  const display = document.getElementById("raffle-winners-display")

  if (!select || !display) return

  const raffleId = select.value
  if (!raffleId) {
    display.innerHTML = '<p class="text-gray-400">Select a raffle to view winners.</p>'
    return
  }

  try {
    const data = await apiRequest(`${BACKEND_URL}/raffles/winners/${raffleId}`)
    display.innerHTML = ""

    if (data.winners && data.winners.length > 0) {
      data.winners.forEach((winner, index) => {
        const winnerCard = document.createElement("div")
        winnerCard.className = "bb-card p-4 mb-3"
        winnerCard.innerHTML = `
                    <h4 class="text-lg font-orbitron text-green-400 mb-2">Winner #${index + 1}</h4>
                    <p class="text-sm text-gray-400 mb-1">Username: <span class="text-white">${winner.username}</span></p>
                    <p class="text-sm text-gray-400 mb-1">Wallet: <span class="text-green-400 break-all">${winner.walletAddress || "Not provided"}</span></p>
                `
        display.appendChild(winnerCard)
      })
    } else {
      display.innerHTML = '<p class="text-yellow-400">No winners announced yet for this raffle.</p>'
    }
  } catch (error) {
    console.error("Error loading raffle winners:", error)
    display.innerHTML = '<p class="text-red-400">Error loading raffle data.</p>'
  }
}

// Handle Create Auction (CORRECTED to avoid null.value error)
async function handleCreateAuction() {
    // We will hardcode the NFT_CONTRACT_ADDRESS here as it's the same for all NFTs
    const NFT_CONTRACT_ADDRESS_FOR_AUCTION = "0x669c46bdf06e111685fd58b271fb3a6a02423274"; // Use your actual NFT contract address

    // Get elements, check for null before accessing .value
    const nameInput = elements.auctionName;
    const imageUrlInput = elements.auctionImageUrl;
    const tokenIdInput = elements.auctionTokenId;
    const durationInput = elements.auctionDuration;
    const minBidInput = elements.auctionMinBid;

    // Check if any critical input element is null
    if (!nameInput || !imageUrlInput || !tokenIdInput || !durationInput || !minBidInput) {
        showNotification("Internal UI error: One or more auction input fields not found. Please refresh.", "error");
        console.error("Auction input element is null. Check IDs in index.html and app.js initializeElements.");
        return;
    }

    const name = nameInput.value.trim();
    const imageUrl = imageUrlInput.value.trim();
    const tokenId = tokenIdInput.value.trim(); // Get as string
    const duration = Number.parseInt(durationInput.value);
    const minBid = Number.parseInt(minBidInput.value);

    // Client-side validation
    if (!name || !imageUrl || !tokenId || isNaN(duration) || duration <= 0 || isNaN(minBid) || minBid < 0) {
        showNotification("Please fill in all required fields correctly (duration >= 1, min bid >= 0).", "error");
        return;
    }

    try {
        await apiRequest(`${BACKEND_URL}/auctions/create`, {
            method: "POST",
            body: JSON.stringify({
                nftContractAddress: NFT_CONTRACT_ADDRESS_FOR_AUCTION, // Use the fixed contract address
                tokenId: tokenId,
                name,
                imageUrl,
                duration,
                minBid,
            }),
        });

        showNotification("Auction created successfully!", "success");

        // Clear form fields
        nameInput.value = "";
        imageUrlInput.value = "";
        tokenIdInput.value = "";
        durationInput.value = "";
        minBidInput.value = "";

        // Optionally refresh auction list on user side after creation
        loadAuctions(); 

    } catch (error) {
        console.error("Error creating auction:", error);
        showNotification(error.message || "Error creating auction.", "error");
    }
}


// Hide admin password input on DOMContentLoaded
document.addEventListener("DOMContentLoaded", () => {
  const adminPasswordInput = document.getElementById("admin-password");
  if (adminPasswordInput) {
    const adminPasswordSection = adminPasswordInput.closest("div");
    if (adminPasswordSection) {
      adminPasswordSection.style.display = 'none';
    }
  }
  const adminLoginButton = document.getElementById("admin-login");
  if (adminLoginButton) {
    adminLoginButton.style.display = 'none';
  }
});