import React, { useRef, useEffect } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas'; // For capturing component content
import MainInvoiceContainer from './InvoiceContainer';

const InvoiceContainer = ({ invoiceData, invoiceContainerRef }) => {
    return (
        <div ref={invoiceContainerRef}>
            <MainInvoiceContainer invoiceData={invoiceData} />
        </div>
    );
}

const App = ({invoiceData, setFillForm}) => {
  const invoiceContainerRef = useRef(null);
  
  const handleGeneratePdf = async () => {
    const invoiceContainer = invoiceContainerRef.current;

    // Ensure component has rendered before capturing content
    if (!invoiceContainer) {
      console.error('Invoice container not found. Ensure component has rendered before generating PDF.');
      return;
    }

    try {
      const canvas = await html2canvas(invoiceContainer, {
        scale: 1, // Adjust scaling for better quality 
        logging: false, // Suppress console logs during rendering
        margin: {
            top: 0, // Set your desired top margin in millimeters
            left: 0, // Set your desired left margin in millimeters
            right: 0, // Set your desired right margin in millimeters
            bottom: 0, // Set your desired bottom margin in millimeters
          }
      });

      const imgData = canvas.toDataURL('image/png');
      const max = {height:300,width:210}

      let height=imgData.height, width=imgData.width, ratio=imgData.height/imgData.width;
        if(height>max.height||width>max.width){
            if(height>width){
                height=max.height;
                width=height*(1/ratio);
                // Making reciprocal of ratio because ration of height as width is no valid here needs width as height
            }
            else if(width > height){
                width=max.width;
                height=width*ratio;
                // Ratio is valid here 
            }
        }


      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        margin: {
            top: 0, // Set your desired top margin in millimeters
            left: 0, // Set your desired left margin in millimeters
            right: 0, // Set your desired right margin in millimeters
            bottom: 0, // Set your desired bottom margin in millimeters
          },
      });

      // Add the invoice component content as an image
      pdf.addImage(imgData, 'PNG', 0, 0, width, height);

      pdf.save('invoice.pdf');
      setFillForm(true);
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      // alert
      alert('An error occurred while generating the PDF. Please check the console for details.');

    }
  };

  useEffect(() => {
    if (invoiceContainerRef.current) {
      handleGeneratePdf(); 
    }
  });

  return (
    <div className="App">
      <InvoiceContainer invoiceContainerRef={invoiceContainerRef} invoiceData={invoiceData} />
      <button onClick={handleGeneratePdf}>Generate PDF</button>
    </div>
  );
};

export default App;
