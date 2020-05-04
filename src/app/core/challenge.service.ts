import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import * as _ from 'underscore';
import * as moment from 'moment';

@Injectable({
  providedIn: 'root'
})
export class ChallengeService {

  challenges;

  constructor(public db: AngularFirestore) {
    let challenges = this.db.collection('challenges');
    challenges.valueChanges().subscribe((items) => {
      this.challenges = _.map(items, item => {
        item.startDate = moment(item.start.seconds * 1000).format('ll');
        item.endDate = moment(item.end.seconds * 1000).format('ll');
        return item;
      });
    });
   }

  getChallenge(id) {
    return _.where(this.challenges, {id: id})[0];
  }
}
