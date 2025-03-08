const { handleGetFactura, handleUploadFactura } = require('../services/mediaService');
const axios = require('axios');
const fs = require('fs');

// Mock de WhatsApp client
const mockClient = {
  sendMessage: jest.fn(),
};

// Mock de Axios
jest.mock('axios');

describe('Pruebas de handleGetFactura', () => {
  it('Debería enviar un mensaje con la URL de la factura cuando el folio existe', async () => {
    const mockMessage = { body: 'trae el folio 12345' };
    const mockResponse = { data: [{ folio: '12345', proveedor: 'ARCOR', image_url: 'https://drive.com/factura.jpg' }] };

    axios.get.mockResolvedValue(mockResponse);

    await handleGetFactura(mockClient, mockMessage);

    expect(mockClient.sendMessage).toHaveBeenCalledWith(
      expect.any(String),
      expect.stringContaining('📄 Factura encontrada para el folio 12345')
    );
  });

  it('Debería enviar un mensaje de error cuando no se encuentra la factura', async () => {
    const mockMessage = { body: 'trae el folio 99999' };
    axios.get.mockResolvedValue({ data: [] });

    await handleGetFactura(mockClient, mockMessage);

    expect(mockClient.sendMessage).toHaveBeenCalledWith(
      expect.any(String),
      '❌ No se encontró una factura con el folio 99999.'
    );
  });
});

describe('Pruebas de handleUploadFactura', () => {
  it('Debería manejar correctamente la subida de una factura', async () => {
    const mockMessage = {
      body: '12345_ARCOR',
      hasMedia: true,
      downloadMedia: jest.fn().mockResolvedValue({ data: 'mocked-image-data' }),
    };

    axios.post.mockResolvedValue({ status: 201, data: { message: 'Factura subida con éxito' } });

    await handleUploadFactura(mockClient, mockMessage);

    expect(mockClient.sendMessage).toHaveBeenCalledWith(
      expect.any(String),
      expect.stringContaining('✅ Factura del proveedor ARCOR con folio 12345 subida con éxito.')
    );
  });

  it('Debería enviar un mensaje de error si el formato es incorrecto', async () => {
    const mockMessage = {
      body: '12345',
      hasMedia: true, // Simulamos que tiene media
      downloadMedia: jest.fn().mockResolvedValue({ data: 'mocked-image-data' }) // Mock de la función
    };    

    await handleUploadFactura(mockClient, mockMessage);

    expect(mockClient.sendMessage).toHaveBeenCalledWith(
      expect.any(String),
      '❌ Error: El formato debe ser [FOLIO]_[PROVEEDOR].'
    );
  });
});
