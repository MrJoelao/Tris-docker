import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { useUser } from '../context/UserContext';
import { useAccessibility } from '../context/AccessibilityContext';

interface NicknameFormData {
  nickname: string;
}

const LandingPage: React.FC = () => {
  const { login, isLoading, error } = useUser();
  const { reducedMotion } = useAccessibility();
  const navigate = useNavigate();
  const [showError, setShowError] = useState<boolean>(false);
  
  const { register, handleSubmit, formState: { errors } } = useForm<NicknameFormData>();
  
  const onSubmit = async (data: NicknameFormData) => {
    try {
      await login(data.nickname);
      navigate('/dashboard');
    } catch (err) {
      setShowError(true);
      setTimeout(() => setShowError(false), 3000);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: reducedMotion ? 0.1 : 0.5,
        when: "beforeChildren",
        staggerChildren: reducedMotion ? 0.1 : 0.3
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: reducedMotion ? 0.1 : 0.5 }
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-primary-700 to-primary-900 p-4">
      <motion.div 
        className="max-w-md w-full bg-white rounded-lg shadow-xl overflow-hidden"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        <div className="p-6">
          <motion.div variants={itemVariants} className="text-center mb-8">
            <h1 className="text-3xl font-bold text-primary-800">Tic-Tac-Toe</h1>
            <p className="text-gray-600 mt-2">Enter your nickname to start playing</p>
          </motion.div>

          <motion.form 
            onSubmit={handleSubmit(onSubmit)}
            variants={itemVariants}
            className="space-y-4"
          >
            <div>
              <label htmlFor="nickname" className="block text-sm font-medium text-gray-700 mb-1">
                Nickname
              </label>
              <input
                id="nickname"
                type="text"
                className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                  errors.nickname ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Choose a nickname"
                aria-label="Your nickname"
                aria-required="true"
                aria-invalid={errors.nickname ? "true" : "false"}
                {...register("nickname", { 
                  required: "Nickname is required",
                  minLength: { value: 3, message: "Nickname must be at least 3 characters" },
                  maxLength: { value: 20, message: "Nickname must not exceed 20 characters" },
                  pattern: { 
                    value: /^[a-zA-Z0-9_-]+$/, 
                    message: "Nickname can only contain letters, numbers, underscores, and hyphens"
                  }
                })}
              />
              {errors.nickname && (
                <p className="mt-1 text-sm text-red-600" role="alert">
                  {errors.nickname.message}
                </p>
              )}
            </div>

            <motion.button
              type="submit"
              className="w-full bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-4 rounded-md transition duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 min-h-[48px]"
              disabled={isLoading}
              whileHover={reducedMotion ? {} : { scale: 1.05 }}
              whileTap={reducedMotion ? {} : { scale: 0.95 }}
              aria-label="Start playing"
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Loading...
                </span>
              ) : (
                "Start Playing"
              )}
            </motion.button>
          </motion.form>

          {(error || showError) && (
            <motion.div
              className="mt-4 p-3 bg-red-100 border border-red-200 text-red-700 rounded-md"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              role="alert"
            >
              <p className="text-sm">{error || "An error occurred. Please try again."}</p>
            </motion.div>
          )}

          <motion.div variants={itemVariants} className="mt-6 text-center text-sm text-gray-500">
            <p>By continuing, you agree to our Terms of Service and Privacy Policy.</p>
          </motion.div>
        </div>
      </motion.div>

      <motion.div 
        variants={itemVariants} 
        className="mt-8 text-center text-white"
      >
        <p className="text-sm">
          <button 
            className="underline focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-primary-800 rounded"
            onClick={() => navigate('/accessibility')}
            aria-label="Accessibility options"
          >
            Accessibility Options
          </button>
        </p>
      </motion.div>
    </div>
  );
};

export default LandingPage;
