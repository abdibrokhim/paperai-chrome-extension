// Create the overlay
const overlay = document.createElement('div');
overlay.id = 'ibm-granite-overlay';

// Create the "Ask IBM Granite" button
const askButton = document.createElement('button');
askButton.id = 'ask-button';
askButton.innerText = 'Ask IBM Granite';

// Append the button to the overlay
overlay.appendChild(askButton);

// Variables to store selected text and range
let selectedText = '';
let selectedRange = null;

// Function to handle text selection
document.addEventListener('mouseup', (event) => {
  console.log('mouseup event: ', event);
  const selection = window.getSelection();
  const text = selection.toString().trim();
  if (text !== '') {
    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();

    // Set the position of the overlay
    overlay.style.top = `${window.scrollY + rect.top - 50}px`; // Adjust as needed
    overlay.style.left = `${window.scrollX + rect.left + rect.width / 2 - 70}px`; // Adjust to center the overlay

    selectedText = text;
    selectedRange = range;

    // Remove existing overlay if any
    const existingOverlay = document.getElementById('ibm-granite-overlay');
    if (existingOverlay) {
      existingOverlay.remove();
    }

    // Append the overlay to the document body
    document.body.appendChild(overlay);
  } else {
    // Remove overlay if no text is selected
    const existingOverlay = document.getElementById('ibm-granite-overlay');
    if (existingOverlay) {
      existingOverlay.remove();
    }
  }
});

// Delay function for 3 seconds
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Handle click on "Ask IBM Granite" button using event delegation
document.body.addEventListener('click', async (event) => {
  console.log('event: ', event);
  if (selectedText.length > 50) { // Check if selected text has more than 20 characters
    console.log('Ask IBM Granite clicked');
    console.log('selectedText: ', selectedText);
    event.stopPropagation();

    // Disable the button
    askButton.disabled = true;
    askButton.innerText = 'Loading...';

    try {
      // Delay for 3 seconds before sending the request
      await delay(3000);

      // Send the selected text to the OpenAI API
      // For testing purposes, we will send request to OpenAI API
      // http://localhost:3001/generateText
      const response = await fetch(process.env.NEXT_PUBLIC_OPENAI_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_OPENAI_API_KEY}`, // Replace with your OpenAI API key
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini', // or any available model you are using
          messages: [
            {
              role: 'system',
              content: 'You are a helpful assistant.'
            },
            {
              role: 'user',
              content: selectedText // This is the text selected by the user
            }
          ]
        }),
      });

      if (!response.ok) {
        throw new Error('API request failed');
      }

      const data = await response.json();
      const generatedText = data.choices[0].message.content.replace(/\n/g, ' ').replace(/"/g, '');

      // Display the response below the selected text
      displayResponse(generatedText);

      // Re-enable the button
      askButton.disabled = false;
      askButton.innerText = 'Ask IBM Granite';
    } catch (error) {
      console.error('Error:', error);
      askButton.disabled = false;
      askButton.innerText = 'Ask IBM Granite';
      alert('An error occurred while fetching the response.');
    }
  }
});

// Function to display the response below the selected text
function displayResponse(responseText) {
  // Create a container for the response
  const responseContainer = document.createElement('div');
  responseContainer.className = 'response-container';

  // Create the formatted response element
  const responseElement = document.createElement('div');
  responseElement.className = 'response-text';
  responseElement.innerText = responseText;

  // Append the response element to the container
  responseContainer.appendChild(responseElement);

  // Insert the responseContainer after the selected text
  if (selectedRange) {
    const range = selectedRange.cloneRange();
    range.collapse(false);

    // Create a temporary container to hold the response
    const tempContainer = document.createElement('div');
    tempContainer.appendChild(responseContainer);

    // Insert the container
    range.insertNode(tempContainer);

    // Clean up the temporary container
    tempContainer.replaceWith(...tempContainer.childNodes);
  } else {
    // If selectedRange is not available, append to body
    document.body.appendChild(responseContainer);
  }
}

// Remove overlay when clicking elsewhere
document.addEventListener('mousedown', (event) => {
  const overlayElement = document.getElementById('ibm-granite-overlay');
  if (overlayElement && !overlayElement.contains(event.target)) {
    overlayElement.remove();
    window.getSelection().removeAllRanges();
  }
});
