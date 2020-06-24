import { Injectable } from '@angular/core';
import { AngularFirestore, AngularFirestoreDocument } from '@angular/fire/firestore';
import * as _ from 'underscore';
import * as moment from 'moment';
import { isCreationMode } from '@angular/core/src/render3/state';
import { UserService } from './user.service';

@Injectable({
  providedIn: 'root'
})
export class ChallengeService {

  challenges;
  currentUser;

  constructor(public db: AngularFirestore, private userService: UserService) {
    this.getChallenges();
  }

  getChallenges() {
    return new Promise<any>((resolve, reject) => {
      this.userService.getCurrentUser().then((user) => {
        this.currentUser = user;
        let challenges = this.db.collection('challenges');
        challenges.valueChanges().subscribe((items) => {
          let challenges = _.map(items, item => {
            let currentTime = Date.now();
            let start = item.start.seconds * 1000;
            let end = item.end.seconds * 1000;
            item.startDate = moment(start).format('ll');
            item.endDate = moment(end).format('ll');
            item.currentChallenge = currentTime > start && currentTime < end;
            item.previousChallenge = currentTime > end;
            item.futureChallenge = currentTime < start;
            item.userInChallenge = item.participants && _.contains(item.participants, user.uid);
            return item;
          });
          this.challenges = challenges.sort(function (a, b) {
            return b.end.seconds - a.end.seconds;
          });
          resolve(this.challenges);
        })
      });
    });
  }

  getChallenge(id) {
    return _.where(this.challenges, {id: id})[0];
  }

  getChallengeAsync(id) {
    return new Promise((resolve, reject) => {
      if (_.isEmpty(this.challenges)) {
        this.getChallenges().then((challenges) => {
          resolve(_.where(this.challenges, {id: id})[0]);
        })
      } else {
        resolve(this.getChallenge(id));
      }
    })
  }

  getCurrentChallenges() {
    return _.where(this.challenges, {'currentChallenge': true});
  }

  getFutureChallenges() {
    return _.where(this.challenges, {'futureChallenge': true});
  }

  getPreviousChallenges() {
    return _.where(this.challenges, {'previousChallenge': true});
  }

  createChallenge(challenge) {
    return this.db.collection('challenges').add(challenge);
  }

  joinChallenge(id, userId) {
    let participants = this.getChallenge(id).participants || [];
    participants.push(userId);
    let challenge = this.db.collection('challenges', ref => {
      return ref.where('id', '==', id);
    });
    let subscription = challenge.snapshotChanges().subscribe((res: any) => {
      let id = res[0].payload.doc.id;
      this.db.collection('challenges').doc(id).update({participants: participants});
      subscription.unsubscribe();
    });
  }

  deleteChallenge(id) {
    let challenge = this.db.collection('challenges', ref => {
      return ref.where('id', '==', id);
    });
    let subscription = challenge.snapshotChanges().subscribe((res: any) => {
      let id = res[0].payload.doc.id;
      this.db.collection('challenges').doc(id).delete();
      subscription.unsubscribe();
    });
  }
}
