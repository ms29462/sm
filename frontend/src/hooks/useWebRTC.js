import { useRef, useState, useCallback } from 'react';

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' }
  ]
};

const useWebRTC = (socket, sessionId, userId) => {
  const [localStream, setLocalStream] = useState(null);
  const [remoteStreams, setRemoteStreams] = useState({});
  const peerConnectionsRef = useRef({});
  const localStreamRef = useRef(null);

  const getLocalMedia = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });
      localStreamRef.current = stream;
      setLocalStream(stream);
      return stream;
    } catch (error) {
      console.error('Error accessing media devices:', error);
      throw error;
    }
  }, []);

  const createPeerConnection = useCallback((remotePeerId) => {
    if (peerConnectionsRef.current[remotePeerId]) {
      return peerConnectionsRef.current[remotePeerId];
    }

    const peerConnection = new RTCPeerConnection(ICE_SERVERS);

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        peerConnection.addTrack(track, localStreamRef.current);
      });
    }

    peerConnection.ontrack = (event) => {
      console.log('Received remote track from:', remotePeerId);
      setRemoteStreams(prev => ({
        ...prev,
        [remotePeerId]: event.streams[0]
      }));
    };

    peerConnection.onicecandidate = (event) => {
      if (event.candidate && socket?.connected) {
        socket.emit('webrtc_ice_candidate', {
          session_id: sessionId,
          from_user: userId,
          candidate: event.candidate
        });
      }
    };

    peerConnection.onconnectionstatechange = () => {
      console.log('Connection state:', peerConnection.connectionState);
    };

    peerConnectionsRef.current[remotePeerId] = peerConnection;
    return peerConnection;
  }, [socket, sessionId, userId]);

  const createOffer = useCallback(async (remotePeerId) => {
    const peerConnection = createPeerConnection(remotePeerId);
    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);
    return offer;
  }, [createPeerConnection]);

  const handleOffer = useCallback(async (remotePeerId, offer) => {
    const peerConnection = createPeerConnection(remotePeerId);
    await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);
    return answer;
  }, [createPeerConnection]);

  const handleAnswer = useCallback(async (remotePeerId, answer) => {
    const peerConnection = peerConnectionsRef.current[remotePeerId];
    if (peerConnection) {
      await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
    }
  }, []);

  const handleIceCandidate = useCallback(async (remotePeerId, candidate) => {
    const peerConnection = peerConnectionsRef.current[remotePeerId];
    if (peerConnection && candidate) {
      try {
        await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (error) {
        console.error('Error adding ICE candidate:', error);
      }
    }
  }, []);

  const closeConnection = useCallback((remotePeerId) => {
    const peerConnection = peerConnectionsRef.current[remotePeerId];
    if (peerConnection) {
      peerConnection.close();
      delete peerConnectionsRef.current[remotePeerId];
    }
    setRemoteStreams(prev => {
      const updated = { ...prev };
      delete updated[remotePeerId];
      return updated;
    });
  }, []);

  const stopLocalStream = useCallback(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
      setLocalStream(null);
    }
  }, []);

  const toggleVideo = useCallback(() => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        return videoTrack.enabled;
      }
    }
    return false;
  }, []);

  const toggleAudio = useCallback(() => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        return audioTrack.enabled;
      }
    }
    return false;
  }, []);

  return {
    localStream,
    remoteStreams,
    getLocalMedia,
    createOffer,
    handleOffer,
    handleAnswer,
    handleIceCandidate,
    closeConnection,
    stopLocalStream,
    toggleVideo,
    toggleAudio
  };
};

export default useWebRTC;