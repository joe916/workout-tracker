import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import * as _ from 'underscore';
import * as moment from 'moment';

@Injectable({
  providedIn: 'root'
})
export class WorkoutService {

  workouts = [];
  workoutLogs;
  userWorkoutLogs = {};
  users = [];
  usersList = [];

  constructor(public db: AngularFirestore) { }

  getWorkouts() {
    return new Promise<any>((resolve, reject) => {
      if (!_.isEmpty(this.workouts)) { resolve(this.workouts); }
      let db = this.db;
      var workouts_snapshot = db.collection('workouts').get();
      workouts_snapshot.forEach((item:any) => {
        item.docs.forEach((workoutItem) => {
          this.workouts.push(workoutItem.data());
        });
      });
      resolve(this.workouts);
    });
  }

  saveWorkout(data) {
    return this.db.collection('workout-logs').add(data);
  }

  getAllWorkouts() {
    this.getWorkouts().then(() => {
      this.workoutLogs = this.db.collection('workout-logs');
      this.workoutLogs.valueChanges().subscribe((items) => {
        let workoutLogFormatted = _.map(items, (item:any) => {
          let workout = _.where(this.workouts, {id: item.workoutId})[0];
          item.workoutName = workout.name;
          item.logTime = moment(item.dateTime).format('LLL');
          item.points = item.count * workout.multiplier;
          return item;
        });
        this.users = _.uniq(_.pluck(workoutLogFormatted, 'userId'));
        _.each(this.users, (user:any) => {
          let item = _.where(workoutLogFormatted, {userId: user})[0];
          this.usersList[user] = item.displayName || "No name";
        });
        _.each(this.users, (userId) => {
          this.userWorkoutLogs[userId] = _.where(workoutLogFormatted, {userId: userId}).sort((a,b) => { return a.dateTime - b.dateTime; });
        });
      });
    })
  }

  getMyTotalPoints(userId) {
    return _.reduce(_.pluck(this.userWorkoutLogs[userId], 'points'), function(memo, num){ return memo + num; }, 0);
  }

  getLeaderBoardData() {
    let leaderBoard = [];
    _.each(this.users, (user) => {
      let item = {
        id: user,
        name: this.usersList[user],
        points: this.getMyTotalPoints(user)
      };
      leaderBoard.push(item);
    });
    leaderBoard.sort(function (a, b) {
      return b.points - a.points;
    });
    return leaderBoard;
  }

}
