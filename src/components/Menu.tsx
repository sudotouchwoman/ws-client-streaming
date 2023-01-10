import { Container, CssBaseline, Typography } from '@mui/material'
import React from 'react'
import SocketContextProvider from '../contexts/WebSocket/WebSocketContext'
import Feed, { Redraws } from './Feed'

type MenuProps = {}

const Menu: React.FC<MenuProps> = (props) => {
  return (
    <React.StrictMode>
      <CssBaseline />
      <SocketContextProvider>
        <Container sx={{
          bgcolor: '#78909c',
          py: 10
        }} >
          <Typography variant='body1'>
            Main app content here
          </Typography>
          <Redraws name='container' />
          <Feed maxEntries={20}/>
        </Container>
      </SocketContextProvider>
    </React.StrictMode>
  )
}

export default Menu