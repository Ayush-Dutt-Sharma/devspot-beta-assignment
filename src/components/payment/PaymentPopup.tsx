import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  CreditCard, 
  Shield, 
  CheckCircle, 
  Info,
  Sparkles,
  Zap,
  Lock,
  ArrowRight
} from 'lucide-react';

interface PaymentDetails {
  sessionId: string;
  paymentUrl: string;
  amount: string;
  currency: string;
  network: string;
  description: string;
}

interface PaymentPopupProps {
  isOpen: boolean;
  onClose: () => void;
  paymentDetails: PaymentDetails;
  onPaymentComplete: () => void;
  hackathonTitle?: string;
}

const PaymentPopup: React.FC<PaymentPopupProps> = ({
  isOpen,
  onClose,
  paymentDetails,
  onPaymentComplete,
  hackathonTitle = "Your Hackathon"
}) => {
  const [paymentStatus, setPaymentStatus] = useState<'ready' | 'processing' | 'completed'>('ready');
  const [showSuccess, setShowSuccess] = useState(false);

  const handlePayment = async () => {
    setPaymentStatus('processing');
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setPaymentStatus('completed');
    setShowSuccess(true);
    
    setTimeout(() => {
      onPaymentComplete();
      onClose();
      setPaymentStatus('ready');
      setShowSuccess(false);
    }, 2000);
  };

  const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 }
  };

  const modalVariants = {
    hidden: { 
      opacity: 0,
      scale: 0.8,
      y: 50
    },
    visible: { 
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        type: "spring",
        damping: 25,
        stiffness: 300
      }
    },
    exit: {
      opacity: 0,
      scale: 0.8,
      y: 50,
      transition: {
        duration: 0.2
      }
    }
  };

  const successVariants = {
    hidden: { scale: 0 },
    visible: { 
      scale: 1,
      transition: {
        type: "spring",
        damping: 15,
        stiffness: 200
      }
    }
  };

  const GridPattern = () => (
    <svg width="60" height="60" className="absolute inset-0 w-full h-full opacity-20">
      <defs>
        <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
          <path d="M 60 0 L 0 0 0 60" fill="none" stroke="white" strokeWidth="1" opacity="0.3"/>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#grid)" />
    </svg>
  );

  const getProcessingButtonClass = () => {
    if (paymentStatus === 'processing') {
      return 'bg-gray-700';
    }
    return 'bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600';
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="fixed inset-0 bg-black/60 backdrop-blur-md z-50"
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            onClick={paymentStatus === 'ready' ? onClose : undefined}
          />

          <motion.div
            className="fixed inset-0 flex items-center justify-center z-50 p-4"
            //@ts-ignore
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl max-w-md w-full overflow-hidden shadow-2xl">
              <div className="relative bg-gradient-to-r from-blue-500 via-purple-500 to-blue-600 p-6">
                <div className="absolute inset-0 animate-pulse">
                  <GridPattern />
                </div>
                
                <div className="relative">
                  <div className="flex items-center justify-between mb-2">
                    <motion.div 
                      className="flex items-center gap-2"
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: 0.2 }}
                    >
                      <div className="p-2 bg-blue-500 bg-opacity-20 rounded-lg backdrop-blur-sm">
                        <Zap className="w-5 h-5 text-white" />
                      </div>
                      <h3 className="text-xl font-bold text-white">Finalize Your Hackathon</h3>
                    </motion.div>
                    
                    {paymentStatus === 'ready' && (
                      <button
                        onClick={onClose}
                        className="p-1.5 hover:bg-blue-500 hover:bg-opacity-10 rounded-lg transition-colors"
                      >
                        <X className="w-5 h-5 text-white opacity-80" />
                      </button>
                    )}
                  </div>
                  
                  <motion.p 
                    className="text-white opacity-90 text-sm"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                  >
                    Complete payment to publish &ldquo;{hackathonTitle}&rdquo;
                  </motion.p>
                </div>
              </div>

              <div className="p-6 bg-black/40 backdrop-blur-lg">
                {!showSuccess ? (
                  <>
                    <motion.div 
                      className="bg-white/10 backdrop-blur-lg border border-white/10 rounded-xl p-4 mb-6"
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.4 }}
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <p className="text-gray-200 text-sm mb-1">Amount to Pay</p>
                          <p className="text-3xl font-bold text-white">
                            ${paymentDetails.amount}
                            <span className="text-lg ml-2 text-gray-200">
                              {paymentDetails.currency}
                            </span>
                          </p>
                        </div>
                        <div className="p-3 bg-blue-500/20 rounded-xl">
                          <CreditCard className="w-6 h-6 text-blue-400" />
                        </div>
                      </div>

                      <div className="space-y-3 pt-3 border-t border-white/10">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-200">Network</span>
                          <span className="text-white font-medium">{paymentDetails.network}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-200">Description</span>
                          <span className="text-white">{paymentDetails.description}</span>
                        </div>
                      </div>
                    </motion.div>

                    <motion.div 
                      className="space-y-3 mb-6"
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.5 }}
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-1.5 bg-green-500/20 rounded-lg">
                          <Shield className="w-4 h-4 text-green-400" />
                        </div>
                        <p className="text-sm text-gray-200">
                          Secure payment processing
                        </p>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <div className="p-1.5 bg-blue-500/20 rounded-lg">
                          <Sparkles className="w-4 h-4 text-blue-400" />
                        </div>
                        <p className="text-sm text-gray-200">
                          Instant hackathon publication after payment
                        </p>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <div className="p-1.5 bg-purple-500/20 rounded-lg">
                          <Lock className="w-4 h-4 text-purple-400" />
                        </div>
                        <p className="text-sm text-gray-200">
                          Your data is encrypted and secure
                        </p>
                      </div>
                    </motion.div>

                    <motion.button
                      onClick={handlePayment}
                      disabled={paymentStatus === 'processing'}
                      className={`w-full relative overflow-hidden group ${getProcessingButtonClass()} text-white font-semibold py-4 px-6 rounded-xl transition-all duration-300 transform hover:scale-[1.02]`}
                      whileHover={{ scale: paymentStatus === 'ready' ? 1.02 : 1 }}
                      whileTap={{ scale: paymentStatus === 'ready' ? 0.98 : 1 }}
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.6 }}
                    >
                      <div className="relative z-10">
                        {paymentStatus === 'processing' ? (
                          <div className="flex items-center justify-center gap-3">
                            <motion.div
                              className="w-5 h-5 border-2 border-gray-500 border-t-white rounded-full"
                              animate={{ rotate: 360 }}
                              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                            />
                            <span>Processing Payment...</span>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center gap-2">
                            <span>Complete Payment</span>
                            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                          </div>
                        )}
                      </div>
                      
                      {paymentStatus === 'ready' && (
                        <motion.div
                          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                          initial={{ x: '-100%' }}
                          animate={{ x: '100%' }}
                          transition={{ duration: 2, repeat: Infinity, repeatDelay: 1, ease: "linear" }}
                        />
                      )}
                    </motion.button>

                    <motion.div 
                      className="flex items-start gap-2 mt-4"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.7 }}
                    >
                      <Info className="w-4 h-4 text-gray-200 mt-0.5" />
                      <p className="text-xs text-gray-200">
                        By completing this payment, you agree to our terms of service. 
                        This is a mock payment for demonstration purposes.
                      </p>
                    </motion.div>
                  </>
                ) : (
                  <motion.div 
                    className="py-12 text-center"
                    //@ts-ignore
                    variants={successVariants}
                    initial="hidden"
                    animate="visible"
                  >
                    <motion.div
                      className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center"
                      animate={{ 
                        scale: [1, 1.1, 1],
                        rotate: [0, 10, -10, 0]
                      }}
                      transition={{ duration: 0.5 }}
                    >
                      <CheckCircle className="w-12 h-12 text-white" />
                    </motion.div>
                    
                    <h3 className="text-2xl font-bold text-white mb-2">
                      Payment Successful!
                    </h3>
                    
                    <p className="text-gray-200">
                      Your hackathon is being published...
                    </p>
                    
                    <motion.div 
                      className="flex justify-center gap-1 mt-4"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.3 }}
                    >
                      {[0, 1, 2].map((i) => (
                        <motion.div
                          key={i}
                          className="w-2 h-2 bg-green-400 rounded-full"
                          animate={{ 
                            scale: [1, 1.5, 1],
                            opacity: [0.5, 1, 0.5]
                          }}
                          transition={{ 
                            duration: 1,
                            repeat: Infinity,
                            delay: i * 0.2 
                          }}
                        />
                      ))}
                    </motion.div>
                  </motion.div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default PaymentPopup;