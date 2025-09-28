import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom';
import * as ReactRouterDom from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import MiniHeader from '../MiniHeader';

const MockColorModeContext = React.createContext({
  mode: 'light',
  isSystem: false,
  toggleColorMode: jest.fn(),
  setPaletteMode: jest.fn()
});

jest.spyOn(ReactRouterDom, 'useLocation').mockReturnValue({ pathname: '/' });
jest.spyOn(ReactRouterDom, 'useNavigate').mockReturnValue(jest.fn());

jest.mock('../../App', () => ({
  ColorModeContext: MockColorModeContext
}));

describe('MiniHeader', () => {
  test(' отображает бренд и навигацию', () => {
    const theme = createTheme({
      palette: { mode: 'light' }
    });

    const colorModeMock = {
      mode: 'light',
      isSystem: false,
      toggleColorMode: jest.fn(),
      setPaletteMode: jest.fn()
    };

    render(
      <MockColorModeContext.Provider value={colorModeMock}>
        <ThemeProvider theme={theme}>
          <BrowserRouter>
            <MiniHeader />
          </BrowserRouter>
        </ThemeProvider>
      </MockColorModeContext.Provider>
    );

    expect(screen.getByLabelText('CURSA')).toBeInTheDocument();
  });
});
