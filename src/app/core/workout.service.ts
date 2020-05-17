import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { ActivatedRoute } from '@angular/router';
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
  challengeId;
  workoutsLoaded = false;

  constructor(
    public db: AngularFirestore,
    private activatedRoute: ActivatedRoute
    ) {
      this.activatedRoute.queryParams.subscribe(params => {
        if (this.challengeId !== params['challengeId']) {
          this.challengeId = params['challengeId'] ? parseInt(params['challengeId']) : "";
          this.getAllWorkouts();
        }
      });
    }

  getWorkouts() {
    return new Promise<any>((resolve, reject) => {
      if (!_.isEmpty(this.workouts)) { resolve(this.workouts); }
      let workouts = [];
      var workouts_snapshot = this.db.collection('workouts').get();
      workouts_snapshot.forEach((item:any) => {
        item.docs.forEach((workoutItem) => {
          workouts.push(workoutItem.data());
        });
      });
      this.workouts = workouts;
      resolve(this.workouts);
    });
  }

  saveWorkout(data) {
    return this.db.collection('workout-logs').add(data);
  }

  getAllWorkouts() {
    this.userWorkoutLogs = {};
    this.getWorkouts().then(() => {
      if (this.challengeId) {
        this.workoutLogs = this.db.collection('workout-logs', ref => {
          return ref.where('challengeId', '==', this.challengeId);
        });
      } else {
        this.workoutLogs = this.db.collection('workout-logs');
      }
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
        this.workoutsLoaded = true;
      });
    })
  }

  getMyTotalPoints(userId) {
    return _.reduce(_.pluck(this.userWorkoutLogs[userId], 'points'), function(memo, num){ return memo + num; }, 0);
  }

  getMyWorkoutPoints(userId) {
    let workoutsOnly = _.filter(this.userWorkoutLogs[userId], (item) => {
      return item.workoutId !== 3; //steps
    });
    return _.reduce(_.pluck(workoutsOnly, 'points'), function(memo, num){ return memo + num; }, 0);
  }

  getMyStepsPoints(userId) {
    let stepsOnly = _.filter(this.userWorkoutLogs[userId], (item) => {
      return item.workoutId === 3; //steps
    });
    return _.reduce(_.pluck(stepsOnly, 'count'), function(memo, num){ return memo + num; }, 0);
  }

  getLeaderBoardData(type) {
    let fn = this.getWorkoutFn(type).bind(this);
    let leaderBoard = [];
    _.each(this.users, (user) => {
      let item = {
        id: user,
        name: this.usersList[user],
        points: fn(user)
      };
      leaderBoard.push(item);
    });
    leaderBoard.sort(function (a, b) {
      return b.points - a.points;
    });
    return leaderBoard;
  }

  getWorkoutFn(type) {
    switch (type) {
      case 'workout':
        return this.getMyWorkoutPoints;
        break;
      case 'steps':
        return this.getMyStepsPoints;
        break;
      default:
        return this.getMyTotalPoints;
    }
  }

  getMyCombinedWorkouts(userId) {
    let workoutGroup = _.groupBy(this.userWorkoutLogs[userId], 'workoutName');
    let combinedWorkouts = [];
    _.each(workoutGroup, (group) => {
      var total = _.reduce(_.pluck(group, 'count'), (memo, num) => { return memo + num; });
      combinedWorkouts.push({ 'workoutName': [group[0].workoutName], 'count': total });
    })
    return combinedWorkouts;
  }

  clearWorkouts() {
    this.workoutLogs = [];
    this.userWorkoutLogs = {};
    this.challengeId = '';
    this.workoutsLoaded = false;
  }

}
