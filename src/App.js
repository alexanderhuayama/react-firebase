import React, { Component } from 'react';
import firebase from 'firebase';
import './App.css'
import FileUpload from './FileUpload';

class App extends Component {
  constructor() {
    super();

    this.state = {
      user: null,
      pictures: []
    };

    this.handleAuth = this.handleAuth.bind(this);
    this.handleLogout = this.handleLogout.bind(this);
    this.handleUpload = this.handleUpload.bind(this);
  }

  handleAuth() {
    const provider = new firebase.auth.GoogleAuthProvider();

    firebase.auth().signInWithPopup(provider)
      .then(result => console.log(`${result.user.email} ha iniciado sesión`))
      .catch(error => console.log(`Error: ${error.code}: ${error.message}`));
  }

  handleLogout() {
    firebase.auth().signOut()
      .then(result => console.log(`${result.user.email} ha salido de la sesión`))
      .catch(error => console.log(`Error: ${error.code}: ${error.message}`));
  }

  handleUpload(event) {
    const file = event.target.files[0];
    const storageRef = firebase.storage().ref(`/photos/${file.name}`);
    const task = storageRef.put(file);

    task.on('state_changed', snapshot => {
      const percentage = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
      this.setState({
        uploadValue: percentage
      });
    }, error => {
      console.log(error.message);
    }, () => {
      storageRef.getDownloadURL()
        .then(url => {
          const record = {
            photoURL: this.state.user.photoURL,
            displayName: this.state.user.displayName,
            image: url
          };

          const dbRef = firebase.database().ref('pictures');
          const newPicture = dbRef.push();
          newPicture.set(record);
        })
        .catch(error => {
          console.log(error.message);
        });
    });
  }

  // Ejecutarse cuando el componente a sido renderizado
  componentWillMount() {
    firebase.auth().onAuthStateChanged(user => {
      this.setState({ user });
    });

    firebase.database().ref('pictures').on('child_added', snapshot => {
      this.setState({
        pictures: this.state.pictures.concat(snapshot.val())
      })
    });
  }

  renderLoginButton() {
    if (this.state.user) {
      return (
        <div>
          <img src={this.state.user.photoURL} alt={this.state.user.displayName} />
          <p>Hola {this.state.user.displayName}</p>
          <button onClick={this.handleLogout}>Logout Google</button>
          <FileUpload
            onUpload={this.handleUpload}
          />

          <br />
          {
            this.state.pictures.map((picture, i) => (
              <div key={i}>
                <img style={
                  {
                    width: 320
                  }
                } src={picture.image} alt="" />
                <br />
                <img style={
                  {
                    width: 50
                  }
                }
                  src={picture.photoURL} alt={picture.displayName} />
                <br />
                <span>{picture.displayName}</span>
              </div>
            ))
              .reverse()
          }
        </div>
      );
    } else {
      return (
        <button onClick={this.handleAuth}>Login con Google</button>
      )
    }
  }

  render() {
    return (
      <div className="App">
        <header className="App-header">
          <h2>React-Firebase</h2>
        </header>
        <div className="App-intro">
          {this.renderLoginButton()}
        </div>
      </div>
    );
  }
}

export default App;