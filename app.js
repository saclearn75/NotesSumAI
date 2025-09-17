    import * as pdfjsLib from 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.3.136/build/pdf.min.mjs';
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.3.136/build/pdf.worker.min.mjs';

    // Get the error message element
    const errorMessage = document.getElementById('error-message');    
    
    // Function to show the error
    function showError(html_str='Some Error Occured') {
        // Remove the hidden class and add the visible class
        html_str = "<h3> " + html_str + "</h3>"
    
        errorMessage.classList.remove('hidden-error');
        errorMessage.classList.add('visible-error');
        errorMessage.innerHTML = html_str;
    }

    // Function to hide the error
    function hideError() {
        // Remove the visible class and add the hidden class
        errorMessage.classList.remove('visible-error');
        errorMessage.classList.add('hidden-error');
    }

    
    document.getElementById('go').onclick = async () => {
      const text = document.getElementById('input').value;
      const max = parseInt(document.getElementById('max').value || '200', 10);
      
      const res = await fetch('http://127.0.0.1:8000/summarize', {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({ text, max_words: max })
      });

      if (!res.ok){
        // the OpenAI API failed due to some reason
        showError('OpenAI API failed: ')
        return
      }
      const data = await res.json();

      console.log("summary received is:", data.summary)
      document.getElementById('out').innerHTML = data.summary || JSON.stringify(data, null, 2);
    };

    document.addEventListener('DOMContentLoaded', function() {
        
        const fileInput = document.getElementById('file_upload');
        const textArea = document.getElementById('input');

        hideError();
        

        fileInput.addEventListener('change', function(event) {
            
            const file = event.target.files[0]; // Get the first file selected
            
            hideError();
            if (!file) {
                showError('No File was selected. Please select a file.')
                return; // Exit if no file was selected
            }
            const fileExtension = file.name.split('.').pop().toLowerCase();            
            console.log (`file extension is ${fileExtension}`)            
            
            const reader = new FileReader();

            if (fileExtension === 'txt') {
                const reader = new FileReader();
                reader.onload = function(e) {
                    textArea.value = e.target.result;
                };
                reader.readAsText(file);
            } else if (fileExtension === 'pdf') {
                const reader = new FileReader();
                reader.onload = function(e) {
                    const typedArray = new Uint8Array(e.target.result);
                    
                    const loadingTask = pdfjsLib.getDocument(typedArray);
                    
                    loadingTask.promise.then(function(pdf) {
                        let fullText = '';
                        const pagePromises = [];

                        for (let i = 1; i <= pdf.numPages; i++) {
                            pagePromises.push(
                                pdf.getPage(i).then(function(page) {
                                    return page.getTextContent();
                                })
                            );
                        }
                        
                        Promise.all(pagePromises).then(function(pagesTextContent) {
                            pagesTextContent.forEach(function(textContent) {
                                textContent.items.forEach(function(item) {
                                    fullText += item.str + ' ';
                                });
                            });
                            textArea.value = fullText.trim();
                        });
                    }).catch(function(reason) {
                        console.error('Error processing PDF:', reason);
                        showError("Failed to process the PDF file:" + reason);
                    });
                };
                reader.readAsArrayBuffer(file);
        } else {
            showError("Unsupported file type. Please select a .txt or .pdf file.");
        }




        //     // This function runs when the file is finished loading
        //     reader.onload = function(e) {
        //         const fileContent = e.target.result;
        //         // The content of the file is now in the `fileContent` variable
        //         textArea.value = fileContent; // Assign the content to the text area
        //     };

        //     // This function runs if there's an error
        //     reader.onerror = function(e) {
        //         console.error("Error reading file:", e);
        //         alert("Failed to read file.");
        //     };

        //     // Read the file as text
        //     reader.readAsText(file);
        });
    });
