import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import * as _ from 'underscore';
import * as moment from 'moment';
import { isCreationMode } from '@angular/core/src/render3/state';

@Injectable({
  providedIn: 'root'
})
export class ChallengeService {

  challenges;

  constructor(public db: AngularFirestore) {
    let challenges = this.db.collection('challenges');
    challenges.valueChanges().subscribe((items) => {
      this.challenges = _.map(items, item => {
        let currentTime = Date.now();
        let start = item.start.seconds * 1000;
        let end = item.end.seconds * 1000;
        item.startDate = moment(start).format('ll');
        item.endDate = moment(end).format('ll');
        item.currentChallenge = currentTime > start && currentTime < end;
        item.previousChallenge = currentTime > end;
        item.futureChallenge = currentTime < start;
        return item;
      });
    });
   }

  getChallenge(id) {
    return _.where(this.challenges, {id: id})[0];
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
}
