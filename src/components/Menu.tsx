import { Container, CssBaseline, Typography } from '@mui/material'
import React from 'react'
import Feed, { Redraws } from './Feed'
import SocketContextProvider from '../contexts/WebSocket/WebSocketContext'

type MenuProps = {}

const Menu = (props: MenuProps) => {
  return (
    <React.StrictMode>
      <CssBaseline />
      <SocketContextProvider>
        <Container sx={{
          bgcolor: 'gainsboro',
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