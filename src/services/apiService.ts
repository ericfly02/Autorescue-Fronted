
/**
 * Service to handle API calls for the AutoRescue application
 */

// Simulate API calls with promises and timeouts
const simulateAPICall = <T>(
  data: T, 
  shouldSucceed: boolean = true, 
  delay: number = 1500
): Promise<T> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (shouldSucceed) {
        resolve(data);
      } else {
        reject(new Error("API call failed"));
      }
    }, delay);
  });
};

/**
 * Validates the voice command and initiates emergency assistance
 * @returns Promise that resolves to a boolean indicating success
 */
export const validateVoiceCommand = async (): Promise<boolean> => {
  try {
    // Simulate a successful API call 80% of the time
    const randomSuccess = Math.random() < 0.8;
    return await simulateAPICall(randomSuccess, true);
  } catch (error) {
    console.error("Voice command validation failed:", error);
    return false;
  }
};

/**
 * Checks if the device has mobile coverage
 * @returns Promise that resolves to a boolean indicating if coverage is available
 */
export const checkDeviceCoverage = async (): Promise<boolean> => {
  try {
    // For demo purposes: randomly determine if device has coverage (70% chance)
    const hasCoverage = Math.random() < 0.7;
    return await simulateAPICall(hasCoverage, true);
  } catch (error) {
    console.error("Coverage check failed:", error);
    return false;
  }
};

/**
 * Validates the SIM card to prevent malicious use
 * @returns Promise that resolves to a boolean indicating if SIM is valid
 */
export const validateSIM = async (): Promise<boolean> => {
  try {
    // For demo purposes: randomly determine if SIM is valid (90% chance)
    const isValidSIM = Math.random() < 0.9;
    return await simulateAPICall(isValidSIM, true);
  } catch (error) {
    console.error("SIM validation failed:", error);
    return false;
  }
};

/**
 * Initiates an emergency phone call
 * @param phoneNumber The emergency phone number to call
 * @returns Promise that resolves to a boolean indicating if call was initiated
 */
export const initiateEmergencyCall = async (phoneNumber: string = "112"): Promise<boolean> => {
  try {
    console.log(`Initiating emergency call to ${phoneNumber}`);
    
    // Check if running in a browser that supports tel: protocol
    if (navigator.userAgent.match(/Android|iPhone|iPad|iPod/i)) {
      window.location.href = `tel:${phoneNumber}`;
      return true;
    } else {
      // In desktop browsers or simulators, just log the action
      console.log(`Emergency call would dial ${phoneNumber} on a mobile device`);
      return await simulateAPICall(true, true);
    }
  } catch (error) {
    console.error("Failed to initiate emergency call:", error);
    return false;
  }
};

/**
 * Submits the emergency form data
 * @param formData The form data to submit
 * @returns Promise that resolves to a boolean indicating success
 */
export const submitEmergencyForm = async (formData: any): Promise<boolean> => {
  try {
    // Log the form data (for demo purposes)
    console.log("Submitting emergency form:", formData);
    
    // Simulate a successful form submission
    return await simulateAPICall(true, true, 2000);
  } catch (error) {
    console.error("Form submission failed:", error);
    return false;
  }
};
