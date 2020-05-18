import { Injectable } from "@angular/core";
import 'rxjs/add/operator/toPromise';
import { AngularFirestore } from '@angular/fire/firestore';
import { AngularFireAuth } from '@angular/fire/auth';
import * as firebase from 'firebase/app';
import * as _ from 'underscore';
import { registerContentQuery } from '@angular/core/src/render3';

@Injectable()
export class UserService {

  constructor(
   public db: AngularFirestore,
   public afAuth: AngularFireAuth
 ){
 }

  users;


  getCurrentUser(){
    return new Promise<any>((resolve, reject) => {
      var user = firebase.auth().onAuthStateChanged(function(user){
        if (user) {
          resolve(user);
        } else {
          reject('No user logged in');
        }
      })
    })
  }

  updateCurrentUser(value){
    return new Promise<any>((resolve, reject) => {
      var user = firebase.auth().currentUser;
      user.updateProfile({
        displayName: value.name,
        photoURL: user.photoURL
      }).then(res => {
        resolve(res);
      }, err => reject(err))
    })
  }

  updateUserTable(userInfo){
    let usersList = this.db.collection('users', ref => {
      return ref.where('uid', '==', userInfo.uid);
    });
    usersList.valueChanges().subscribe((items) => {
      if (!items || _.isEmpty(items)) {
        let usersList = this.db.collection('users');
        usersList.add(userInfo);
      }
    });
  }

  getUsers() {
    return new Promise((resolve, reject) => {
      if (this.users) {
        resolve(this.users);
      } else {
        this.db.collection('users').valueChanges().subscribe((users) => {
          this.users = users;
          resolve(this.users);
        });
      }
    });
  }
}
