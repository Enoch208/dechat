"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { 
  Eye, 
  EyeOff, 
  MessageSquare, 
  Copy, 
  Loader2, 
  HomeIcon, 
  User, 
  Shield, 
  Layers, 
  Users
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useAuth } from "./contexts/AuthContext"
import DisplayNameForm from "./components/DisplayNameForm"
import ChatRoom from "./components/ChatRoom"

export default function Home() {
  // Use a ref to track if the component is mounted
  const isMounted = useRef(false)

  const { user, currentRoom, checkExistingUser, signIn, knownDisplayName } = useAuth()
  const [firstPhrase, setFirstPhrase] = useState("")
  const [secondPhrase, setSecondPhrase] = useState("")
  const [hostPassword, setHostPassword] = useState("")
  const [isHost, setIsHost] = useState(false)
  const [generatedCodes, setGeneratedCodes] = useState({
    firstPhrase: "",
    secondPhrase: "",
    hostPassword: "",
  })
  const [showGeneratedCode, setShowGeneratedCode] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [isCheckingUser, setIsCheckingUser] = useState(false)
  const [isMobileView, setIsMobileView] = useState(false)
  const [showFirstPhrase, setShowFirstPhrase] = useState(false)
  const [showSecondPhrase, setShowSecondPhrase] = useState(false)
  const [showHostPassword, setShowHostPassword] = useState(false)
  const [showDisplayNameForm, setShowDisplayNameForm] = useState(false)
  const [isGeneratingCode, setIsGeneratingCode] = useState(false)

  // Track active input field
  const [activeInputId, setActiveInputId] = useState<string | null>(null)
  
  // References to maintain focus
  const firstPhraseRef = useRef<HTMLInputElement>(null)
  const secondPhraseRef = useRef<HTMLInputElement>(null)
  const hostPasswordRef = useRef<HTMLInputElement>(null)

  // Focus handler for visibility toggles
  useEffect(() => {
    // Re-focus the active input after visibility state changes
    if (activeInputId === "firstPhrase" && firstPhraseRef.current) {
      firstPhraseRef.current.focus()
    } else if (activeInputId === "secondPhrase" && secondPhraseRef.current) {
      secondPhraseRef.current.focus()
    } else if (activeInputId === "hostPassword" && hostPasswordRef.current) {
      hostPasswordRef.current.focus()
    }
  }, [showFirstPhrase, showSecondPhrase, showHostPassword, activeInputId])

  // Use a debounced version of the resize handler to prevent excessive updates
  useEffect(() => {
    // Mark component as mounted
    isMounted.current = true

    // Define checkMobile function that uses a minimum width
    const checkMobile = () => {
      if (!isMounted.current) return
      const width = Math.max(window.innerWidth, 320)
      setIsMobileView(width < 640)
    }

    // Initial check
    checkMobile()

    // Debounced resize handler
    let resizeTimer: ReturnType<typeof setTimeout>
    const handleResize = () => {
      clearTimeout(resizeTimer)
      resizeTimer = setTimeout(() => {
        if (isMounted.current) {
          checkMobile()
        }
      }, 100)
    }

    // Add event listener
    window.addEventListener("resize", handleResize)

    // Cleanup
    return () => {
      isMounted.current = false
      window.removeEventListener("resize", handleResize)
      clearTimeout(resizeTimer)
    }
  }, [])

  const handleGenerateCode = useCallback(async () => {
    try {
      setIsGeneratingCode(true);
      
      // Use our API to generate phrases instead of client-side generation
      const response = await fetch('/api/generate-code');
      
      if (!response.ok) {
        throw new Error('Failed to generate secure phrases');
      }
      
      const data = await response.json();
      
      setGeneratedCodes({
        firstPhrase: data.firstPhrase,
        secondPhrase: data.secondPhrase,
        hostPassword: data.hostPassword,
      });
      
      setShowGeneratedCode(true);
      setIsHost(true); // Auto-check the host option when generating
    } catch (error) {
      console.error('Error generating code:', error);
      alert('Failed to generate phrases. Please try again.');
    } finally {
      setIsGeneratingCode(false);
    }
  }, []);

  const handleConnect = async () => {
    if (!firstPhrase || !secondPhrase || (isHost && !hostPassword)) {
      return;
    }
    
    setIsConnecting(true);
    setIsCheckingUser(true);
    
    try {
      // Check if user exists with these credentials
      const roomData = {
        firstPhrase,
        secondPhrase,
        hostPassword: isHost ? hostPassword : undefined,
        isHost
      };
      
      const existingDisplayName = await checkExistingUser(roomData);
      
      if (existingDisplayName) {
        // If we already know this user, sign in directly
        await signIn(roomData);
      } else {
        // Otherwise show the display name form
        setShowDisplayNameForm(true);
      }
    } catch (error) {
      console.error('Error checking user:', error);
      alert('Error connecting to room. Please check your phrases and try again.');
    } finally {
      setIsConnecting(false);
      setIsCheckingUser(false);
    }
  };

  // If user is authenticated and in a room, show the chat
  if (user && currentRoom) {
    return <ChatRoom />;
  }

  // If waiting for display name, show the form
  if (showDisplayNameForm) {
    return (
      <div className="fixed inset-0 w-screen h-screen overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100">
        <main className="flex flex-col h-full w-full overflow-y-auto overflow-x-hidden">
          {isMobileView && (
            <div className="h-6 bg-green-600 flex items-center justify-between px-4 w-full flex-shrink-0">
              <div className="text-white text-xs font-semibold">9:41</div>
              <div className="flex items-center space-x-1">
                <div className="w-4 h-2 bg-white rounded-sm"></div>
              </div>
            </div>
          )}

          <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 w-full">
            <DisplayNameForm 
              roomData={{
                firstPhrase,
                secondPhrase,
                hostPassword: isHost ? hostPassword : undefined,
                isHost,
              }}
              onSuccess={() => {
                // After authentication success, this component will auto-redirect to chat
                // since user and currentRoom will be set in the auth context
              }}
            />
          </div>

          {isMobileView && (
            <div className="h-14 bg-white border-t border-gray-200 flex items-center justify-center px-4 w-full flex-shrink-0">
              <div className="flex flex-col items-center">
                <HomeIcon className="h-6 w-6 text-green-600" />
                <span className="text-sm font-medium text-gray-700 mt-1">Home</span>
              </div>
            </div>
          )}
        </main>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 w-screen h-screen overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100">
      <main className="flex flex-col h-full w-full overflow-y-auto overflow-x-hidden">
        {/* Mobile status bar simulation */}
        {isMobileView && (
          <div className="h-6 bg-green-600 flex items-center justify-between px-4 w-full flex-shrink-0">
            <div className="text-white text-xs font-semibold">9:41</div>
            <div className="flex items-center space-x-1">
              <div className="w-4 h-2 bg-white rounded-sm"></div>
            </div>
          </div>
        )}

        <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 w-full">
          <div className="w-full max-w-md mx-auto">
            {/* App header with logo */}
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-blue-500 rounded-full mx-auto mb-4 flex items-center justify-center shadow-lg">
                <MessageSquare className="h-10 w-10 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-gray-800">
                DeChat
              </h1>
              <p className="text-gray-600 text-base mt-2">End-to-end encrypted messaging</p>
            </div>

            {/* Seed phrase entry card */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-5 shadow-md">
              <h2 className="text-xl font-semibold text-center mb-5 text-gray-800 flex items-center justify-center">
                <User className="h-5 w-5 mr-2 text-green-600" />
                <span>Enter Access Phrases</span>
              </h2>

              <div className="space-y-5">
                <div>
                  <label htmlFor="firstPhrase" className="block text-sm font-medium text-gray-700 mb-1">
                    First Phrase
                  </label>
                  <div className="relative">
                    <Input
                      ref={firstPhraseRef}
                      type={showFirstPhrase ? "text" : "password"}
                      id="firstPhrase"
                      value={firstPhrase}
                      onChange={(e) => setFirstPhrase(e.target.value)}
                      onFocus={() => setActiveInputId("firstPhrase")}
                      placeholder="Enter the first phrase"
                      autoComplete="off"
                      className="pr-10 text-lg tracking-wider h-12 px-4 py-3 border-gray-300 focus:border-green-500 focus:ring-green-500"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full px-3"
                      onMouseDown={(e) => {
                        e.preventDefault(); // This prevents the input from losing focus
                        setShowFirstPhrase(!showFirstPhrase);
                      }}
                      aria-label={showFirstPhrase ? "Hide password" : "Show password"}
                    >
                      {showFirstPhrase ? <EyeOff className="h-5 w-5 text-gray-500" /> : <Eye className="h-5 w-5 text-gray-500" />}
                    </Button>
                  </div>
                </div>

                <div>
                  <label htmlFor="secondPhrase" className="block text-sm font-medium text-gray-700 mb-1">
                    Second Phrase
                  </label>
                  <div className="relative">
                    <Input
                      ref={secondPhraseRef}
                      type={showSecondPhrase ? "text" : "password"}
                      id="secondPhrase"
                      value={secondPhrase}
                      onChange={(e) => setSecondPhrase(e.target.value)}
                      onFocus={() => setActiveInputId("secondPhrase")}
                      placeholder="Enter the second phrase"
                      autoComplete="off"
                      className="pr-10 text-lg tracking-wider h-12 px-4 py-3 border-gray-300 focus:border-green-500 focus:ring-green-500"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full px-3"
                      onMouseDown={(e) => {
                        e.preventDefault(); 
                        setShowSecondPhrase(!showSecondPhrase);
                      }}
                      aria-label={showSecondPhrase ? "Hide password" : "Show password"}
                    >
                      {showSecondPhrase ? <EyeOff className="h-5 w-5 text-gray-500" /> : <Eye className="h-5 w-5 text-gray-500" />}
                    </Button>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    The order of phrases matters for secure access
                  </p>
                </div>

                <div className="mt-4 flex items-center">
                  <input
                    id="hostOption"
                    type="checkbox"
                    checked={isHost}
                    onChange={() => setIsHost(!isHost)}
                    className="h-4 w-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                  />
                  <label htmlFor="hostOption" className="ml-2 block text-sm text-gray-700 flex items-center">
                    <Shield className="h-4 w-4 mr-1 text-green-600" />
                    I am the host of this chat
                  </label>
                </div>

                {isHost && (
                  <div className="mt-3">
                    <label htmlFor="hostPassword" className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                      <Layers className="h-4 w-4 mr-1 text-green-600" />
                      Host Password <span className="text-xs text-gray-500 ml-1">(from generation)</span>
                    </label>
                    <div className="relative">
                      <Input
                        ref={hostPasswordRef}
                        type={showHostPassword ? "text" : "password"}
                        id="hostPassword"
                        value={hostPassword}
                        onChange={(e) => setHostPassword(e.target.value)}
                        onFocus={() => setActiveInputId("hostPassword")}
                        placeholder="Enter your host password"
                        autoComplete="off"
                        className="pr-10 text-lg tracking-wider h-12 px-4 py-3 border-gray-300 focus:border-green-500 focus:ring-green-500"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full px-3"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          setShowHostPassword(!showHostPassword);
                        }}
                        aria-label={showHostPassword ? "Hide password" : "Show password"}
                      >
                        {showHostPassword ? <EyeOff className="h-5 w-5 text-gray-500" /> : <Eye className="h-5 w-5 text-gray-500" />}
                      </Button>
                    </div>
                    <p className="mt-1 text-xs text-gray-500">Only the room creator needs this special password</p>
                  </div>
                )}
              </div>

              <div className="mt-6">
                <Button
                  onClick={handleConnect}
                  disabled={!firstPhrase || !secondPhrase || (isHost && !hostPassword) || isConnecting || isCheckingUser}
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3 text-lg h-auto rounded-xl"
                >
                  {isConnecting || isCheckingUser ? (
                    <span className="flex items-center justify-center">
                      <Loader2 className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" />
                      {knownDisplayName ? "Signing in..." : "Checking..."}
                    </span>
                  ) : isHost ? (
                    <span className="flex items-center justify-center">
                      <Shield className="h-5 w-5 mr-2" />
                      {knownDisplayName ? `Continue as ${knownDisplayName}` : "Create Room"}
                    </span>
                  ) : (
                    <span className="flex items-center justify-center">
                      <Users className="h-5 w-5 mr-2" />
                      {knownDisplayName ? `Continue as ${knownDisplayName}` : "Join Room"}
                    </span>
                  )}
                </Button>
              </div>
            </div>

            {/* Generate code section */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-md">
              <h2 className="text-xl font-semibold text-center mb-4 text-gray-800 flex items-center justify-center">
                <Layers className="h-5 w-5 mr-2 text-green-600" />
                <span>Create New Room</span>
              </h2>

              {showGeneratedCode ? (
                <div>
                  <div className="bg-gray-50 rounded-lg p-5 border border-gray-200">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                      <div>
                      <div className="flex justify-between items-center mb-2">
                          <p className="text-sm font-semibold text-gray-700">First Phrase</p>
                          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">Required</span>
                      </div>
                        <div className="font-mono text-lg font-bold text-green-600 text-center p-3 bg-white border border-green-100 rounded-md">
                        {generatedCodes.firstPhrase}
                      </div>
                    </div>

                      <div>
                      <div className="flex justify-between items-center mb-2">
                          <p className="text-sm font-semibold text-gray-700">Second Phrase</p>
                          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">Required</span>
                      </div>
                        <div className="font-mono text-lg font-bold text-blue-600 text-center p-3 bg-white border border-blue-100 rounded-md">
                        {generatedCodes.secondPhrase}
                        </div>
                      </div>
                    </div>

                    <div className="mb-3">
                      <div className="flex justify-between items-center mb-2">
                        <p className="text-sm font-semibold text-gray-700 flex items-center">
                          <Shield className="h-4 w-4 mr-1 text-green-600" />
                          Host Password
                        </p>
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">Host Only</span>
                      </div>
                      <div className="font-mono text-lg font-bold text-red-600 text-center p-3 bg-white border border-red-100 rounded-md">
                        {generatedCodes.hostPassword}
                      </div>
                      <p className="mt-1 text-xs text-gray-500 text-center">
                        Keep this password private - only you as host need it
                      </p>
                    </div>

                    <div className="mt-4 p-3 bg-yellow-50 border border-yellow-100 rounded-md">
                      <p className="text-sm text-gray-700">
                        <span className="font-semibold">Important: </span>
                        Share only the first and second phrases with your contact. They will enter them in the exact
                        same order. Keep the host password for yourself.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-3 mt-5">
                    <Button
                      onClick={() => {
                        // Copy functionality
                        const textToCopy = `Join my DeChat room with these phrases:\n1st phrase: ${generatedCodes.firstPhrase}\n2nd phrase: ${generatedCodes.secondPhrase}`
                        navigator.clipboard?.writeText(textToCopy)
                        alert("Room details copied to clipboard! You can share these with your contact.")
                      }}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 text-base h-auto flex items-center justify-center rounded-xl"
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Copy Room Details to Share
                    </Button>
                    <Button
                      onClick={() => {
                        // Auto-fill the form with generated codes
                        setFirstPhrase(generatedCodes.firstPhrase);
                        setSecondPhrase(generatedCodes.secondPhrase);
                        setHostPassword(generatedCodes.hostPassword);
                        setIsHost(true);
                      }}
                      className="bg-green-600 hover:bg-green-700 text-white font-medium py-3 text-base h-auto rounded-xl"
                    >
                      Use These Phrases to Create Room
                    </Button>
                    <Button
                      onClick={() => setShowGeneratedCode(false)}
                      variant="outline"
                      className="text-gray-700 font-medium py-2 text-base h-auto rounded-xl"
                    >
                      Generate New Room
                    </Button>
                  </div>
                </div>
              ) : (
                <div>
                  <p className="text-sm text-gray-600 mb-4 text-center">
                    Create a new secure chat room with unique access phrases. You&apos;ll be the host of this room.
                  </p>
                  <Button
                    onClick={handleGenerateCode}
                    disabled={isGeneratingCode}
                    className="w-full bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white font-medium py-3 text-lg h-auto rounded-xl"
                  >
                    {isGeneratingCode ? (
                      <span className="flex items-center justify-center">
                        <Loader2 className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" />
                        Generating...
                      </span>
                    ) : (
                      <span className="flex items-center justify-center">
                        <Layers className="h-5 w-5 mr-2" />
                        Generate Secure Phrases
                      </span>
                    )}
                  </Button>
                </div>
              )}
            </div>

            {/* Mobile app indicator */}
            <div className="mt-6 flex justify-center">
              <div className="w-24 h-1 bg-gray-200 rounded-full"></div>
            </div>
          </div>
        </div>

        {/* Mobile-style bottom navigation */}
        {isMobileView && (
          <div className="h-14 bg-white border-t border-gray-200 flex items-center justify-center px-4 w-full flex-shrink-0">
            <div className="flex flex-col items-center">
              <HomeIcon className="h-6 w-6 text-green-600" />
              <span className="text-sm font-medium text-gray-700 mt-1">Home</span>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
