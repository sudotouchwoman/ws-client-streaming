import { Container, CssBaseline, Typography } from '@mui/material'
import React from 'react'
import { defaultAddr, WebSocketProvider } from '../contexts/UseWebsocket'
import Feed, { Redraws } from './Feed'

type MenuProps = {}

const Menu = (props: MenuProps) => {
  return (
    <React.StrictMode>
      <CssBaseline />
      {/* <WebSocketProvider url={defaultAddr}> */}
        <Container sx={{
          bgcolor: 'gainsboro',
          py: 10
        }} >
          <Typography variant='body1'>
            Main app content here
          </Typography>
          <Redraws name='container'/>
          <Feed />
        </Container>
      {/* </WebSocketProvider> */}
    </React.StrictMode>
  )
}

export default Menu